import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    Zap,
    Search,
    Activity,
    BarChart3,
    ArrowRight,
    Globe,
    Cpu,
    Lock,
    CheckCircle2,
    ChevronDown,
    Monitor,
    Menu,
    X
} from 'lucide-react';

const Landing = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const navLinks = [
        { label: 'Products', href: '#features' },
        { label: 'Demo', href: '#demo' },
        { label: 'Industry', href: '#security' },
        { label: 'FAQ', href: '#faq' }
    ];

    const features = [
        {
            icon: <Monitor className="text-blue-600" size={22} />,
            title: "QA-First Workflow",
            description: "Full API access and bearer token injection for complex authenticated testing. No more brittle UI-only tests.",
            tag: "input_inject(\"X-Auth-Token\", token_ID)"
        },
        {
            icon: <Cpu className="text-blue-600" size={22} />,
            title: "CI/CD Integration",
            description: "Seamless GitHub Actions and GitLab CI support. Automatically trigger agents on every pull request or merge.",
            tag: "yaml_deployment_template.yml"
        },
        {
            icon: <BarChart3 className="text-blue-600" size={22} />,
            title: "Custom Scripting",
            description: "Extend agent capabilities with raw Playwright and Puppeteer scripts. Handle complex iframe and web workers with ease.",
            tag: "const user = waitFor(Selector('input.main'))"
        }
    ];

    const faqs = [
        {
            q: "How does the agent handle dynamic CSS selectors?",
            a: "Our agent uses a hybrid scoring system that combines accessibility roles, text content, and visual position to maintain stability even when class names change."
        },
        {
            q: "Is my application code shared during scans?",
            a: "No. The agent runs in a sandboxed environment and only interacts with the rendered DOM of your application. Your source code remains private."
        },
        {
            q: "Can I use custom Playwright or Puppeteer plugins?",
            a: "Yes! Advanced users can inject custom plugins to handle specialized requirements like biometric simulation or custom tracking scripts."
        }
    ];

    const scrollTo = (href) => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    return (
        <div className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Shield className="text-white" size={18} />
                        </div>
                        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800">Auto<span className="text-slate-900">QA</span> Agent</span>
                    </div>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop auth */}
                    <div className="hidden md:flex items-center gap-5">
                        <Link to="/login" className="text-[11px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">Log In</Link>
                        <Link
                            to="/home"
                            className="px-5 py-2.5 bg-[#2563eb] text-white rounded-xl text-[11px] font-black shadow-xl shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile menu dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md overflow-hidden"
                        >
                            <div className="px-5 py-4 flex flex-col gap-2">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                                        className="px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                                <div className="border-t border-slate-100 mt-2 pt-3 flex flex-col gap-2">
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                                        Log In
                                    </Link>
                                    <Link
                                        to="/home"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-5 py-3 bg-[#2563eb] text-white rounded-xl text-[11px] font-black uppercase tracking-wider text-center shadow-lg shadow-blue-200/50"
                                    >
                                        Get Started Free
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className="pt-28 sm:pt-40 lg:pt-48 pb-16 sm:pb-24 lg:pb-32 px-5 sm:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                    <div className="lg:w-[55%] space-y-6 sm:space-y-8 text-center lg:text-left">
                        <h1 className="text-4xl sm:text-6xl md:text-[72px] lg:text-[80px] font-black text-slate-900 leading-[0.95] tracking-tighter">
                            Autonomous QA for <span className="text-blue-600">Modern Engineering</span> Teams
                        </h1>
                        <p className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Deploy high-fidelity agentic workflows with native Playwright and Puppeteer integration. Scale your testing without scaling your team.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center lg:justify-start">
                            <Link
                                to="/home"
                                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-[#2563eb] text-white rounded-xl text-[12px] sm:text-[13px] font-black shadow-2xl shadow-blue-200/50 hover:bg-blue-800 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center uppercase tracking-widest"
                            >
                                Start Automating
                            </Link>
                            <button className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-xl text-[12px] sm:text-[13px] font-black hover:bg-slate-50 transition-colors uppercase tracking-widest">
                                View Documentation
                            </button>
                        </div>
                    </div>

                    {/* Terminal Block */}
                    <div className="lg:w-[45%] w-full max-w-xl">
                        <div className="bg-[#0f172a] rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-800 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-5 sm:mb-6">
                                <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                            </div>
                            <div className="font-mono text-[11px] sm:text-[13px] space-y-3 overflow-x-auto">
                                <p className="text-emerald-400 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                    <span className="text-slate-600">1</span>
                                    <span>npx autoqa-agent deploy --env prod</span>
                                </p>
                                <p className="text-slate-300 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                    <span className="text-slate-600">2</span>
                                    <span>• Loading playwright environment...</span>
                                </p>
                                <p className="text-slate-300 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                    <span className="text-slate-600">3</span>
                                    <span>• Authenticating via Bearer Token...</span>
                                </p>
                                <div className="pb-2 space-y-1">
                                    <p className="text-indigo-400 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                        <span className="text-slate-600">4</span>
                                        <span>• Running 124 test suites in parallel...</span>
                                    </p>
                                    <div className="pl-5 sm:pl-6 pt-1 space-y-1">
                                        <p className="text-emerald-400/80 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                            <CheckCircle2 size={12} /> <span>Checkout Flow</span> <span className="text-slate-600 ml-auto">2.4s</span>
                                        </p>
                                        <p className="text-emerald-400/80 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                            <CheckCircle2 size={12} /> <span>API Gateway Auth</span> <span className="text-slate-600 ml-auto">0.8s</span>
                                        </p>
                                        <p className="text-blue-400 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                            <span>Dynamic UI Rendering</span> <span className="text-slate-400 ml-auto italic">In Progress</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Engineering-First Section */}
            <section id="features" className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 bg-slate-50/50 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-10 sm:mb-16 lg:mb-20 text-center sm:text-left">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Engineering-First Infrastructure</h2>
                        <p className="text-slate-500 font-medium text-sm sm:text-base">Built for developers who demand deep technical control and performance.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-white p-7 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 sm:mb-8">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">{feature.title}</h3>
                                <p className="text-slate-500 text-xs sm:text-[13px] font-medium leading-relaxed mb-6 sm:mb-8">
                                    {feature.description}
                                </p>
                                <div className="px-3 sm:px-4 py-2 bg-slate-50 rounded-xl font-mono text-[9px] sm:text-[10px] text-slate-400 border border-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {feature.tag}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Security Section */}
            <section id="security" className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 bg-blue-50/30 relative overflow-hidden scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
                    {/* Left Text */}
                    <div className="lg:w-1/2 space-y-6 sm:space-y-10 text-center lg:text-left">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                            Security-First Quality Assurance
                        </h2>
                        <p className="text-base sm:text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            We treat your data and code with the highest security standards. AutoQA Agent is designed for enterprise compliance from day one.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 sm:gap-y-10 pt-2 sm:pt-4 cursor-default text-left">
                            {[
                                { title: 'SOC2 Type II', text: 'Rigorous independent audits of all our security controls.' },
                                { title: 'AES-256 Encryption', text: 'All data at rest and in transit is fully encrypted.' },
                                { title: 'Zero-Trust Scans', text: 'Execute scans without storing sensitive credentials.' },
                                { title: 'SSO/SAML', text: 'Enterprise authentication for your whole team.' }
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1.5 sm:space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="text-blue-600 shrink-0" size={14} />
                                        <h4 className="font-extrabold text-slate-900 text-sm italic">{item.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Card */}
                    <div className="lg:w-1/2 w-full max-w-lg mx-auto">
                        <div className="bg-white p-7 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white">
                            <div className="flex items-center gap-4 mb-7 sm:mb-10">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Shield className="text-white" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 tracking-tight text-sm sm:text-base">Security Certificate</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Infrastructure Security</p>
                                </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                {[
                                    { label: 'End-to-End Tunneling', status: 'ACTIVE', color: 'text-emerald-500 bg-emerald-50' },
                                    { label: 'IP Whitelisting', status: 'ENABLED', color: 'text-blue-500 bg-blue-50' },
                                    { label: 'Automated Vulnerability Log', status: 'COMPLIANT', color: 'text-emerald-500 bg-emerald-50' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-slate-50/50 rounded-xl sm:rounded-2xl border border-slate-50 gap-4">
                                        <span className="text-xs font-bold text-slate-600 tracking-tight">{item.label}</span>
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-lg shrink-0 ${item.color}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 scroll-mt-20">
                <div className="max-w-3xl mx-auto space-y-10 sm:space-y-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white border-b border-slate-100 overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full py-5 sm:py-8 flex items-center justify-between text-left gap-4 group"
                                >
                                    <span className="font-bold text-sm sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{faq.q}</span>
                                    <ChevronDown className={`text-slate-300 transition-transform shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} size={22} />
                                </button>
                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pb-6 sm:pb-8 text-slate-500 font-medium leading-relaxed text-sm">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join / CTA Section */}
            <section className="px-5 sm:px-8 pb-16 sm:pb-24 lg:pb-32">
                <div className="max-w-7xl mx-auto bg-blue-700 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-14 lg:p-20 text-center text-white shadow-2xl shadow-blue-200 relative overflow-hidden flex flex-col items-center">
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tighter mb-6 sm:mb-10 max-w-2xl">
                        Join 500+ teams automating their quality assurance.
                    </h2>
                    <p className="text-base sm:text-xl text-blue-100 font-medium max-w-xl mb-8 sm:mb-12">
                        Stop manual regression testing, start shipping faster with autonomous QA agents that work while you sleep.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md">
                        <input
                            type="email"
                            placeholder="work@company.com"
                            className="flex-1 bg-white text-slate-900 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl outline-none font-bold placeholder:text-slate-300 border-none w-full text-sm"
                        />
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full sm:w-auto px-7 sm:px-10 py-3.5 sm:py-4 bg-white text-[#2563eb] rounded-xl text-[11px] sm:text-[13px] font-black shadow-xl hover:bg-slate-50 transition-all uppercase tracking-widest whitespace-nowrap"
                        >
                            Get Started Free
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-8 text-[11px] font-black uppercase tracking-widest text-blue-200/60 pt-6 sm:pt-8">
                        <span>• 14-Day Free Trial</span>
                        <span>• NO Credit card required</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 sm:py-16 px-5 sm:px-8 border-t border-slate-100 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
                    <div className="flex items-center gap-2.5 opacity-50">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <Shield className="text-white" size={12} />
                        </div>
                        <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase italic">AutoQA Agent</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Security</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                    </div>

                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-[0.2em] text-center md:text-right">
                        © 2024 AutoQA Agent Inc. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
