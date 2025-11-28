export default function SettingsPage() {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
                    <p className="text-slate-400 mt-2">
                        Configure your AI assistant preferences.
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">General Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-200">Theme</p>
                                <p className="text-sm text-slate-500">Customize the look and feel</p>
                            </div>
                            <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                                <option>Dark</option>
                                <option>Light</option>
                                <option>System</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-200">Model</p>
                                <p className="text-sm text-slate-500">Select the AI model to use</p>
                            </div>
                            <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                                <option>GPT-4o</option>
                                <option>GPT-3.5 Turbo</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
