'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import Header from '@/components/dashboard/Header';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, CheckCircle, Clock, XCircle, Award, TrendingUp, Users, Target, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define types for our data structures
type Intern = {
    uid: string;
    displayName: string;
    domain: string[];
};

type Submission = {
    id: string;
    internId: string;
    status: 'pending' | 'approved' | 'revision_needed';
    points: number;
};

type InternStats = Intern & {
    totalSubmissions: number;
    approved: number;
    pending: number;
    revision: number;
    totalPoints: number;
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // emerald, amber, red

export default function HealthPage() {
    const { user } = useAuth();
    const { setLoading: setGlobalLoading } = useLoading();
    const [stats, setStats] = useState<InternStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all interns
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = await getDocs(usersQuery);
                const interns: Intern[] = [];
                usersSnapshot.forEach(doc => {
                    if (doc.data().role === 'intern') {
                        interns.push({ uid: doc.id, ...doc.data() } as Intern);
                    }
                });

                // Fetch all submissions
                const subsQuery = query(collection(db, 'submissions'));
                const subsSnapshot = await getDocs(subsQuery);
                const submissions: Submission[] = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));            // Compute stats for each intern
            const computedStats = interns.map(intern => {
                const internSubmissions = submissions.filter(s => s.internId === intern.uid);
                return {
                    ...intern,
                    totalSubmissions: internSubmissions.length,
                    approved: internSubmissions.filter(s => s.status === 'approved').length,
                    pending: internSubmissions.filter(s => s.status === 'pending').length,
                    revision: internSubmissions.filter(s => s.status === 'revision_needed').length,
                    totalPoints: internSubmissions.reduce((acc, s) => acc + s.points, 0),
                };
            });

            setStats(computedStats);
        } catch (error) {
            console.warn('Failed to fetch health data:', error);
            setStats([]);        } finally {
            setLoading(false);
            // Turn off global loading when this page is ready
            setGlobalLoading(false);
        }
    };    fetchData();
}, [setGlobalLoading]);

const overallStats = {
    totalSubmissions: stats.reduce((acc, s) => acc + s.totalSubmissions, 0),
    totalApproved: stats.reduce((acc, s) => acc + s.approved, 0),
    totalPending: stats.reduce((acc, s) => acc + s.pending, 0),
    totalRevision: stats.reduce((acc, s) => acc + s.revision, 0),
    totalPoints: stats.reduce((acc, s) => acc + s.totalPoints, 0),
};

const pieData = [
    { name: 'Approved', value: overallStats.totalApproved },
    { name: 'Pending', value: overallStats.totalPending },
    { name: 'Needs Revision', value: overallStats.totalRevision },
];

if (loading) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Analytics Dashboard" />
            <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md mx-auto text-center">
                    <div className="glass-card">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Analytics</h3>
                        <p className="text-gray-600">Gathering performance data...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

return (
    <div className="min-h-screen flex flex-col">
        <Header title="Analytics Dashboard" />
        <div className="text-center py-8 px-4">
          <h2 className="text-4xl font-bold text-white mb-3">Internship Health</h2>
          <p className="text-white/80 text-lg">Analytics and performance metrics</p>
        </div>
        <main className="flex-grow p-4 sm:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <Card className="glass-card glass-card-hover">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-800">{stats.length}</p>
                                <p className="text-gray-600 font-medium">Total Interns</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card glass-card-hover">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-800">{overallStats.totalApproved}</p>
                                <p className="text-gray-600 font-medium">Approved</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card glass-card-hover">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-800">{overallStats.totalPending}</p>
                                <p className="text-gray-600 font-medium">Pending Review</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card glass-card-hover">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-800">{overallStats.totalPoints}</p>
                                <p className="text-gray-600 font-medium">Total Points</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                                <Award className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
                <Card className="lg:col-span-3 glass-card">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                            Performance Overview
                        </CardTitle>
                        <CardDescription>Points earned by each intern</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={stats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="displayName" tick={{ fontSize: 12 }} stroke="#4b5563" />
                                <YAxis stroke="#4b5563" />
                                <Tooltip 
                                    cursor={{fill: 'rgba(75, 85, 99, 0.1)'}}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                        border: '1px solid rgba(0,0,0,0.1)', 
                                        borderRadius: '1rem',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                                    }} 
                                />
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                <Bar dataKey="totalPoints" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} barSize={30} />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.7}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 glass-card">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                            <Target className="w-6 h-6 text-purple-600" />
                            Submission Status
                        </CardTitle>
                        <CardDescription>Overall submission breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={70}
                                    outerRadius={120} 
                                    paddingAngle={5}
                                    labelLine={false}
                                    label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                        border: '1px solid rgba(0,0,0,0.1)', 
                                        borderRadius: '1rem',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                                    }} 
                                />
                                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{paddingLeft: '20px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Performance Table */}
            <Card className="glass-card">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-xl font-bold text-gray-800">Detailed Performance</CardTitle>
                    <CardDescription>Individual intern statistics and rankings</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200/60">
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Intern</th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Submissions</th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                        <span className="flex items-center justify-center gap-1.5">
                                            <CheckCircle className="w-4 h-4 text-green-600" /> Approved
                                        </span>
                                    </th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Clock className="w-4 h-4 text-amber-600" /> Pending
                                        </span>
                                    </th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                        <span className="flex items-center justify-center gap-1.5">
                                            <XCircle className="w-4 h-4 text-red-600" /> Revision
                                        </span>
                                    </th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Award className="w-4 h-4 text-purple-600" /> Points
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/80">
                                {stats.sort((a,b) => b.totalPoints - a.totalPoints).map((intern, index) => (
                                    <tr key={intern.uid} className="hover:bg-gray-500/10 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge 
                                                variant="outline" 
                                                className={`font-bold text-base border-2 px-3 py-1 rounded-lg
                                                    ${index === 0 ? 'bg-yellow-100/80 border-yellow-300 text-yellow-800' : 
                                                      index === 1 ? 'bg-gray-100/80 border-gray-300 text-gray-800' : 
                                                      index === 2 ? 'bg-orange-100/80 border-orange-300 text-orange-800' : 
                                                      'bg-indigo-100/60 border-indigo-200 text-indigo-800'}
                                                `}
                                            >
                                                #{index + 1}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{intern.displayName}</td>
                                        <td className="px-6 py-4 text-center font-semibold text-gray-600">{intern.totalSubmissions}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className="bg-green-100/80 text-green-800 font-medium px-3 py-1 rounded-md">{intern.approved}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className="bg-amber-100/80 text-amber-800 font-medium px-3 py-1 rounded-md">{intern.pending}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className="bg-red-100/80 text-red-800 font-medium px-3 py-1 rounded-md">{intern.revision}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className="bg-purple-100/80 text-purple-800 font-bold text-base px-3 py-1 rounded-md">{intern.totalPoints}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
          </div>
        </main>
    </div>
);
}