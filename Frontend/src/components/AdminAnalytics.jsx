import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const AdminAnalytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/admin/analytics');
        setData(data);
      } catch (error) {
        console.error("Error fetching analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-text-muted text-center animate-pulse py-20 font-black uppercase tracking-widest">Processing Analytics...</div>;

  const totalUsers = data.reduce((acc, curr) => acc + curr.users, 0);
  const totalPosts = data.reduce((acc, curr) => acc + curr.posts, 0);
  const totalComments = data.reduce((acc, curr) => acc + curr.comments, 0);

  const pieData = [
    { name: 'New Users', value: totalUsers },
    { name: 'Posts', value: totalPosts },
    { name: 'Comments', value: totalComments },
  ];

  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipText = theme === 'dark' ? '#ffffff' : '#0f172a';

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-black text-text-main">Performance Trends</h2>
        <p className="text-text-muted text-sm mt-1">Growth and engagement metrics over the last 7 days</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart - User Growth */}
        <div className="bg-surface border border-border-main p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-lg font-black text-text-main mb-8 flex items-center gap-3">
             <div className="w-2 h-6 bg-accent rounded-full"></div>
             User Signups Trend
          </h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={axisColor} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: tooltipText, fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', opacity: 0.7 }} />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: tooltipBg }} activeDot={{ r: 8, strokeWidth: 0 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Activity */}
        <div className="bg-surface border border-border-main p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-lg font-black text-text-main mb-8 flex items-center gap-3">
             <div className="w-2 h-6 bg-green-500 rounded-full"></div>
             Daily Activity
          </h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={axisColor} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: tooltipText, fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', opacity: 0.7 }} />
                <Bar dataKey="posts" fill="#10b981" radius={[4, 4, 0, 0]} name="Posts" barSize={20} />
                <Bar dataKey="comments" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Comments" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie Chart - Distribution */}
      <div className="bg-surface border border-border-main p-8 rounded-[2.5rem] shadow-sm max-w-2xl">
        <h3 className="text-lg font-black text-text-main mb-8 flex items-center gap-3">
           <div className="w-2 h-6 bg-red-500 rounded-full"></div>
           Activity Distribution
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div style={{ width: 300, height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '16px' }}
                        itemStyle={{ color: tooltipText, fontWeight: 'bold' }}
                    />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
                {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest">{item.name}</p>
                            <p className="text-xl font-black text-text-main">{item.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
