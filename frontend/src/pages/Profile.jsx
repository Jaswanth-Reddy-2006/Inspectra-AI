import React from 'react';
import { User, Shield, Mail, Key, Bell, Globe } from 'lucide-react';

const Profile = () => {
    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your personal information and security preferences.</p>
            </header>

            <div className="space-y-6">
                <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200">
                            <User size={40} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">Alex Rivera</h3>
                            <p className="text-slate-500 font-medium">Enterprise Administrator</p>
                        </div>
                        <button className="ml-auto px-6 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm border border-slate-100 hover:bg-slate-100 transition-all">
                            Change Avatar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input type="text" defaultValue="Alex Rivera" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input type="email" defaultValue="alex@acme.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-900" />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Key size={20} />
                        </div>
                        <h4 className="font-black text-slate-900">Security</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Update password and enable 2FA.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Bell size={20} />
                        </div>
                        <h4 className="font-black text-slate-900">Notifications</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Manage your email and slack alerts.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Globe size={20} />
                        </div>
                        <h4 className="font-black text-slate-900">Region</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Configure scan node locations.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Profile;
