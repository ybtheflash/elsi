'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, CheckCircle, Clock, XCircle, Award } from 'lucide-react';
// Define types for our data structures
type Intern = {
uid: string;
displayName: string;
domain: string[];
// Add other fields if needed
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
const COLORS = ['#4ade80', '#facc15', '#f87171']; // green, yellow, red
export default function HealthPage() {
const { user } = useAuth();
const [stats, setStats] = useState<InternStats[]>([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
    const fetchData = async () => {
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
        const submissions: Submission[] = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

        // Compute stats for each intern
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
        setLoading(false);
    };

    fetchData();
}, []);

const overallStats = {
    totalSubmissions: stats.reduce((acc, s) => acc + s.totalSubmissions, 0),
    totalApproved: stats.reduce((acc, s) => acc + s.approved, 0),
    totalPending: stats.reduce((acc, s) => acc + s.pending, 0),
};

const pieData = [
    { name: 'Approved', value: overallStats.totalApproved },
    { name: 'Pending', value: overallStats.totalPending },
    { name: 'Needs Revision', value: stats.reduce((acc, s) => acc + s.revision, 0) },
];

if (loading) {
    return (
        <>
            <Header title="Intern Health" />
            <div className="mt-6 text-center">Loading health statistics...</div>
        </>
    );
}

return (
    <>
        <Header title="Intern Health" />
        <div className="mt-6">
            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4"><User className="text-blue-500" size={32}/><div><p className="text-2xl font-bold">{stats.length}</p><p className="text-gray-500">Total Interns</p></div></div>
                <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4"><CheckCircle className="text-green-500" size={32}/><div><p className="text-2xl font-bold">{overallStats.totalApproved}</p><p className="text-gray-500">Approved Submissions</p></div></div>
                <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4"><Clock className="text-yellow-500" size={32}/><div><p className="text-2xl font-bold">{overallStats.totalPending}</p><p className="text-gray-500">Pending Reviews</p></div></div>
                <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4"><Award className="text-indigo-500" size={32}/><div><p className="text-2xl font-bold">{stats.reduce((acc, s) => acc + s.totalPoints, 0)}</p><p className="text-gray-500">Total Points Awarded</p></div></div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="font-semibold mb-4">Total Points per Intern</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats}>
                            <XAxis dataKey="displayName" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalPoints" fill="#8884d8" name="Total Points"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="font-semibold mb-4">Overall Submission Status</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Detailed Intern Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold">Intern</th>
                                <th className="px-4 py-2 font-semibold">Total Submissions</th>
                                <th className="px-4 py-2 font-semibold text-green-600">Approved</th>
                                <th className="px-4 py-2 font-semibold text-yellow-600">Pending</th>
                                <th className="px-4 py-2 font-semibold text-red-600">Revision</th>
                                <th className="px-4 py-2 font-semibold">Total Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {stats.sort((a,b) => b.totalPoints - a.totalPoints).map(intern => (
                                <tr key={intern.uid} className="text-center">
                                    <td className="px-4 py-2 text-left">{intern.displayName}</td>
                                    <td className="px-4 py-2">{intern.totalSubmissions}</td>
                                    <td className="px-4 py-2">{intern.approved}</td>
                                    <td className="px-4 py-2">{intern.pending}</td>
                                    <td className="px-4 py-2">{intern.revision}</td>
                                    <td className="px-4 py-2 font-bold">{intern.totalPoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>            </div>
        </div>
    </>
);
}