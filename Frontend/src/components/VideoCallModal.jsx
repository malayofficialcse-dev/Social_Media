import { useState, useEffect, useRef } from 'react';
import { FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneAlt } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        peerConnectionRef.current = new RTCPeerConnection(servers);

        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { to: partner._id, candidate: event.candidate });
          }
        };

        if (callType === 'outgoing') {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('call-user', {
            userToCall: partner._id,
            signalData: offer,
            from: user._id,
            name: user.username
          });
        } else if (callType === 'incoming' && incomingSignal) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingSignal));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer-call', { to: partner._id, signal: answer });
          setIsAccepted(true);
          setIsCalling(false);
        }
      } catch (err) {
        console.error("Call initialization failed", err);
        toast.error("Could not access camera/microphone");
        onHangup();
      }
    };

    initCall();

    const handleCallAccepted = async (signal) => {
      setIsAccepted(true);
      setIsCalling(false);
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
    };

    const handleIceCandidate = async (candidate) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error("Error adding ice candidate", e);
      }
    };

    const handleCallEnded = () => {
      toast.info("Call ended");
      onHangup();
    };

    const handleCallRejected = () => {
      toast.error("Call rejected");
      onHangup();
    };

    socket.on('call-accepted', handleCallAccepted);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-rejected', handleCallRejected);

    return () => {
      socket.off('call-accepted', handleCallAccepted);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-rejected', handleCallRejected);
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const hangup = () => {
    socket.emit('end-call', { to: partner._id });
    onHangup();
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
