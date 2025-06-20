'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wrench, Phone, Mail, Globe, X, ExternalLink } from 'lucide-react';

const Footer = () => {
    const [showToolsModal, setShowToolsModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    const tools = [
        {
            name: "EL Brand Toolkit",
            url: "https://bit.ly/el-brand-toolkit",
            description: "EL's official brand assets and guidelines"
        },
        {
            name: "CloudConvert",
            url: "https://cloudconvert.com/",
            description: "Convert files between formats"
        },
        {
            name: "ILovePDF",
            url: "https://www.ilovepdf.com/",
            description: "PDF tools and utilities"
        },
        {
            name: "Gemini AI",
            url: "https://aistudio.google.com/prompts/new_chat",
            description: "AI-powered chat and content generation"
        }
    ];

    const contacts = [
        {
            name: "Maithree Roy",
            phone: "+91 98308 33572",
            type: "phone"
        },
        {
            name: "Yubaraj Biswas",
            phone: "+91 98832 89005",
            email: "ybtheflash@gmail.com",
            website: "ybtheflash.in",
            type: "full"
        }
    ];    return (
        <>
            {/* Footer */}
            <footer className="mt-auto border-t border-white/10 bg-black/20 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Left side - Copyright */}
                        <div className="text-white/60 text-sm">
                            © 2025 ELSI. All rights reserved.
                        </div>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowToolsModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                            >
                                <Wrench className="w-4 h-4" />
                                Tools
                            </button>
                            <button
                                onClick={() => setShowContactModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                            >
                                <Phone className="w-4 h-4" />
                                Contact
                            </button>
                        </div>
                    </div>
                </div>
            </footer>            {/* Modals rendered via portal */}
            {typeof window !== 'undefined' && showToolsModal && createPortal(
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
                    style={{ zIndex: 100000 }}
                    onClick={() => setShowToolsModal(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200"
                        onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <Wrench className="w-6 h-6 text-blue-600" />
                                    Tools & Resources
                                </h3>
                                <p className="text-gray-600 mt-1">Helpful tools for your workflow</p>
                            </div>
                            <button 
                                onClick={() => setShowToolsModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {tools.map((tool, index) => (
                                <a
                                    key={index}
                                    href={tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-all duration-200 hover:scale-[1.02] group"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                            {tool.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </a>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl">
                            <p className="text-sm text-gray-600 text-center">
                                Need more tools? Contact the admin to add more resources.
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}            {typeof window !== 'undefined' && showContactModal && createPortal(
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
                    style={{ zIndex: 100000 }}
                    onClick={() => setShowContactModal(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200"
                        onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <Phone className="w-6 h-6 text-green-600" />
                                    Contact Information
                                </h3>
                                <p className="text-gray-600 mt-1">Get in touch with us</p>
                            </div>
                            <button 
                                onClick={() => setShowContactModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {contacts.map((contact, index) => (
                                <div key={index} className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 text-lg mb-4">{contact.name}</h4>
                                    <div className="space-y-3">
                                        {/* Phone */}
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors group"
                                        >
                                            <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center transition-colors">
                                                <Phone className="w-5 h-5 text-green-600" />
                                            </div>
                                            <span className="font-medium">{contact.phone}</span>
                                        </a>

                                        {/* Email (for Yubaraj only) */}
                                        {contact.email && (
                                            <a
                                                href={`mailto:${contact.email}`}
                                                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors group"
                                            >
                                                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center transition-colors">
                                                    <Mail className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="font-medium">{contact.email}</span>
                                            </a>
                                        )}

                                        {/* Website (for Yubaraj only) */}
                                        {contact.website && (
                                            <a
                                                href={`https://${contact.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-gray-700 hover:text-purple-600 transition-colors group"
                                            >
                                                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center transition-colors">
                                                    <Globe className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <span className="font-medium">{contact.website}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl">
                            <p className="text-sm text-gray-600 text-center">
                                Available fairly anytime for assistance.
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Footer;
