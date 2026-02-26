import React, { useState } from 'react';
import axios from 'axios';

const yearOptions = { SY: 'SY', TY: 'TY', BE: 'BE' };
const semesterOptions = { SY: ['3', '4'], TY: ['5', '6'], BE: ['7', '8'] };
const courseTypes = ['Regular', 'ILE', 'DLE', 'OE', 'HONOR', 'MINOR'];

function ConfirmModal({ message, collectionName, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Confirm Deletion</h3>
                <p className="text-gray-600">{message}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm font-mono text-red-700 break-all">
                    {collectionName}
                </div>
                <p className="text-sm text-red-600 font-medium">
                    This action is irreversible. All data in this collection will be permanently deleted.
                </p>
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── NEW: double-confirm modal for the nuclear option ─────────────────────── */
function FlushConfirmModal({ onConfirm, onCancel }) {
    const [typed, setTyped] = useState('');
    const CONFIRM_PHRASE = 'DELETE ALL';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4">
                <h3 className="text-xl font-bold text-red-700">⚠️ Flush Entire Database</h3>
                <p className="text-gray-600">
                    This will permanently drop <span className="font-semibold text-gray-800">every collection</span> in
                    the database. There is no undo.
                </p>
                <p className="text-sm text-gray-500">
                    Type <span className="font-mono font-bold text-red-600">{CONFIRM_PHRASE}</span> below to confirm:
                </p>
                <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={CONFIRM_PHRASE}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={typed !== CONFIRM_PHRASE}
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Flush Database
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── NEW: Flush All component ─────────────────────────────────────────────── */
function FlushDatabase() {
    const [status, setStatus] = useState(null);
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFlush = async () => {
        setConfirm(false);
        setStatus(null);
        setLoading(true);
        try {
            const res = await axios.delete('https://testsphereitdjsce.vercel.app/delete/all');
            setStatus({ type: 'success', message: res.data.message });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to flush the database.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border-2 border-red-200">
            <div className="flex items-center gap-3 border-b pb-3">
                <span className="text-2xl">🗑️</span>
                <h2 className="text-xl font-semibold text-red-700">Flush Entire Database</h2>
            </div>

            <p className="text-sm text-gray-500">
                Drops <span className="font-semibold text-gray-700">all collections</span> currently present in the
                MongoDB database. Use only when you want to start completely fresh. This cannot be undone.
            </p>

            {status && (
                <div
                    className={`rounded-lg px-4 py-3 text-sm font-medium ${
                        status.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                >
                    {status.message}
                </div>
            )}

            <button
                onClick={() => { setStatus(null); setConfirm(true); }}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-red-700 text-white font-medium hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Flushing…' : '⚠️ Flush All Collections'}
            </button>

            {confirm && (
                <FlushConfirmModal
                    onConfirm={handleFlush}
                    onCancel={() => setConfirm(false)}
                />
            )}
        </div>
    );
}

function DeleteStudentData() {
    const [year, setYear] = useState('');
    const [examType, setExamType] = useState('');
    const [courseType, setCourseType] = useState('');
    const [status, setStatus] = useState(null);
    const [confirm, setConfirm] = useState(false);

    const collectionName = examType === 'retest'
        ? (year ? `${year}_retest` : '')
        : (year && courseType ? `${year}_${courseType}_Data` : '');

    const canSubmit =
        year &&
        examType &&
        (examType === 'retest' || (examType === 'normal' && courseType));

    const handleDelete = async () => {
        setConfirm(false);
        setStatus(null);
        try {
            const params = { year, examType };
            if (examType === 'normal') params.courseType = courseType;
            const res = await axios.delete('https://testsphereitdjsce.vercel.app/delete/students', { params });
            setStatus({ type: 'success', message: res.data.message });
            setYear(''); setExamType(''); setCourseType('');
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to delete student data.',
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Delete Student Data</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                    value={year}
                    onChange={(e) => { setYear(e.target.value); setExamType(''); setCourseType(''); setStatus(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                    <option value="">Select Year</option>
                    {Object.entries(yearOptions).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
            </div>

            {year && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                    <div className="flex gap-4">
                        {['normal', 'retest'].map((et) => (
                            <button
                                key={et}
                                onClick={() => { setExamType(et); setCourseType(''); setStatus(null); }}
                                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                    examType === et
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {et === 'normal' ? 'Normal' : 'Retest'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {examType === 'normal' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
                    <select
                        value={courseType}
                        onChange={(e) => { setCourseType(e.target.value); setStatus(null); }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                        <option value="">Select Course Type</option>
                        {courseTypes.map((ct) => (
                            <option key={ct} value={ct}>{ct}</option>
                        ))}
                    </select>
                </div>
            )}

            {collectionName && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-500">Collection to delete: </span>
                    <span className="font-mono font-semibold text-gray-800">{collectionName}</span>
                </div>
            )}

            {status && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    status.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    {status.message}
                </div>
            )}

            <button
                disabled={!canSubmit}
                onClick={() => { setStatus(null); setConfirm(true); }}
                className="w-full py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Delete Student Data
            </button>

            {confirm && (
                <ConfirmModal
                    message="Are you sure you want to delete all student data for:"
                    collectionName={collectionName}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirm(false)}
                />
            )}
        </div>
    );
}

function DeleteSubjectData() {
    const [year, setYear] = useState('');
    const [semester, setSemester] = useState('');
    const [status, setStatus] = useState(null);
    const [confirm, setConfirm] = useState(false);

    const collectionName = year && semester ? `${year}_Sem${semester}_Subjects` : '';

    const handleDelete = async () => {
        setConfirm(false);
        setStatus(null);
        try {
            const res = await axios.delete('https://testsphereitdjsce.vercel.app/delete/subjects', { params: { year, semester } });
            setStatus({ type: 'success', message: res.data.message });
            setYear(''); setSemester('');
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to delete subject data.',
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Delete Subject Data</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                    value={year}
                    onChange={(e) => { setYear(e.target.value); setSemester(''); setStatus(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                    <option value="">Select Year</option>
                    {Object.entries(yearOptions).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
            </div>

            {year && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                        value={semester}
                        onChange={(e) => { setSemester(e.target.value); setStatus(null); }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                        <option value="">Select Semester</option>
                        {semesterOptions[year].map((s) => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>
                </div>
            )}

            {collectionName && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-500">Collection to delete: </span>
                    <span className="font-mono font-semibold text-gray-800">{collectionName}</span>
                </div>
            )}

            {status && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    status.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    {status.message}
                </div>
            )}

            <button
                disabled={!year || !semester}
                onClick={() => { setStatus(null); setConfirm(true); }}
                className="w-full py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Delete Subject Data
            </button>

            {confirm && (
                <ConfirmModal
                    message="Are you sure you want to delete all subject data for:"
                    collectionName={collectionName}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirm(false)}
                />
            )}
        </div>
    );
}

export default function DeleteData() {
    return (
        <div className="min-h-screen bg-gray-100 px-4 py-10">
            <div className="max-w-5xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-gray-800">Delete Database Collections</h1>
                <p className="text-gray-500 text-sm -mt-4">
                    Select the collection you want to permanently remove from the database.
                </p>

                {/* Existing two cards */}
                <div className="grid gap-8 md:grid-cols-2">
                    <DeleteStudentData />
                    <DeleteSubjectData />
                </div>

                {/* Flush all — full width, visually separated */}
                <div className="pt-2">
                    <FlushDatabase />
                </div>
            </div>
        </div>
    );
}