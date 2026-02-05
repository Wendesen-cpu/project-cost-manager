'use client';

import { loginAdmin } from '@/app/actions/auth';
import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nContext';
import { LogIn, Mail, Lock, ShieldCheck, ArrowRight, Globe } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
    const { t, language, setLanguage } = useI18n();
    const [state, action, pending] = useActionState(async (prev: any, formData: FormData) => {
        return await loginAdmin(formData);
    }, null);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Language Switcher */}
                <div className="flex justify-end mb-8">
                    <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200/60">
                        <button
                            onClick={() => setLanguage('en')}
                            className={clsx(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                                language === 'en' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage('it')}
                            className={clsx(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                                language === 'it' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            IT
                        </button>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white relative overflow-hidden">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-tr from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-slate-200 -rotate-3">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">{t('adminLogin.title')}</h2>
                        <p className="text-slate-500 font-medium">{t('adminLogin.welcomeBack')}</p>
                    </div>

                    {state?.error && (
                        <div className="bg-red-50/50 border border-red-100 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3 animate-shake">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            {state.error}
                        </div>
                    )}

                    <form action={action} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('adminLogin.email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@company.com"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300 shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('adminLogin.password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300 shadow-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full group bg-gradient-to-br from-slate-900 to-slate-800 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 hover:shadow-slate-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            {pending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {t('adminLogin.loggingIn')}
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    {t('adminLogin.button')}
                                </>
                            )}
                        </button>

                        <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                {t('adminLogin.superAdminNote')}
                            </p>
                            <Link
                                href="/employee/login"
                                className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors group"
                            >
                                {t('adminLogin.goToEmployee')}
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
