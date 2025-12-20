import { useState, useEffect, useRef } from 'react';
import { FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneAlt } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const servers = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
};

const VideoCallModal = ({ partner, callType, incomingSignal, onHangup }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCalling, setIsCalling] = useState(callType === 'outgoing');
  const [isAccepted, setIsAccepted] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const localStreamRef = useRef();
  const candidateQueue = useRef([]);
  const onHangupRef = useRef(onHangup);
  
  // Update ref if onHangup changes
  useEffect(() => {
    onHangupRef.current = onHangup;
  }, [onHangup]);

  const isMounted = useRef(true);
  const initStarted = useRef(false);

  // Sync streams with video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    isMounted.current = true;
    if (initStarted.current) return;
    initStarted.current = true;
    
    const processQueuedCandidates = async () => {
      while (candidateQueue.current.length > 0 && peerConnectionRef.current?.remoteDescription) {
        const candidate = candidateQueue.current.shift();
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ice candidate", e);
        }
      }
    };

    const initCall = async () => {
      try {
        console.log("Requesting media permissions...");
        
        // Ensure any previous stream is closed first
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });

        if (!isMounted.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection(servers);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          console.log("Remote track received:", event.track.kind);
          if (isMounted.current) {
            const [remoteStream] = event.streams;
            if (remoteStream) {
              setRemoteStream(remoteStream);
            } else {
              setRemoteStream(prev => {
                const newStream = prev || new MediaStream();
                if (!newStream.getTracks().find(t => t.id === event.track.id)) {
                  newStream.addTrack(event.track);
                }
                return new MediaStream(newStream.getTracks());
              });
            }
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && isMounted.current) {
            socket.emit('ice-candidate', { to: partner._id, candidate: event.candidate });
          }
        };

        if (callType === 'outgoing') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call-user', {
            userToCall: partner._id,
            signalData: offer,
            from: user._id,
            name: user.username
          });
        } else if (callType === 'incoming' && incomingSignal) {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer-call', { to: partner._id, signal: answer });
          setIsAccepted(true);
          setIsCalling(false);
          processQueuedCandidates();
        }
      } catch (err) {
        console.error("Call initialization failed", err);
        if (err.name === 'NotAllowedError') {
          toast.error("Camera/Microphone access denied.");
        } else if (err.name === 'NotReadableError') {
          toast.error("Hardware busy. Close other apps using your camera/mic and REFRESH.");
        } else {
          toast.error("Could not start video call. Check hardware.");
        }
        onHangupRef.current();
      }
    };

    // Delay slightly to allow hardware to settle from any previous use
    const timer = setTimeout(() => {
      if (isMounted.current) {
        initCall();
      }
    }, 500);

    const handleCallAccepted = async (signal) => {
      try {
        if (peerConnectionRef.current) {
          setIsAccepted(true);
          setIsCalling(false);
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          processQueuedCandidates();
        }
      } catch (err) {
        console.error("Error handling call acceptance", err);
      }
    };

    const handleIceCandidate = async (candidate) => {
      if (peerConnectionRef.current?.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      } else {
        candidateQueue.current.push(candidate);
      }
    };

    const handleCallEnded = () => {
      toast.info("Call ended");
      onHangupRef.current();
    };

    const handleCallRejected = () => {
      toast.error("Call rejected");
      onHangupRef.current();
    };

    socket.on('call-accepted', handleCallAccepted);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-rejected', handleCallRejected);

    return () => {
      isMounted.current = false;
      socket.off('call-accepted', handleCallAccepted);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-rejected', handleCallRejected);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      clearTimeout(timer);
    };
    // Note: Dependencies kept to essential identity factors to avoid re-mounting logic mid-call
  }, [partner._id, callType, incomingSignal, socket, user._id, user.username]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const hangup = () => {
    socket.emit('end-call', { to: partner._id });
    onHangupRef.current();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden glass border-white/10 shadow-2xl">
        
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 bg-slate-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {(!isAccepted || !remoteStream) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
              <img 
                src={partner.profileImage || `https://ui-avatars.com/api/?name=${partner.username}&background=random`} 
                className={`w-32 h-32 rounded-full border-4 border-accent/20 ${isCalling ? 'animate-pulse' : ''}`}
                alt={partner.username}
              />
              <h2 className="text-2xl font-black text-white mt-6 uppercase tracking-widest">{partner.username}</h2>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                {isCalling ? "Calling..." : "Connecting..."}
              </p>
            </div>
          )}
        </div>

        {/* Local Video (PIP) */}
        <div className="absolute top-4 right-4 w-1/4 max-w-[200px] aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-slate-700"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <FaVideoSlash className="text-white/40" />
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-20">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
          </button>

          <button
            onClick={hangup}
            className="p-6 bg-red-600 text-white rounded-full hover:bg-red-700 hover:scale-110 transition-all shadow-xl shadow-red-600/20"
          >
            <FaPhoneSlash size={32} />
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isVideoOff ? <FaVideoSlash size={24} /> : <FaVideo size={24} />}
          </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-2">Secure P2P Connection</p>
        <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-400 text-[10px] font-bold">End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
