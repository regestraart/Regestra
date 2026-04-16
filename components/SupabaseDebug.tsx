
import React, { useState } from 'react';
import { Database, Settings, X, Save, Trash2, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { isSupabaseConfigured, saveManualConfig, clearManualConfig } from '../lib/supabase';

export const SupabaseDebug = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copied, setCopied] = useState(false);
  
  const isManual = !!localStorage.getItem('SB_URL');

  const handleSave = () => {
    if (url && key) {
        saveManualConfig(url, key);
    }
  };

  const handleClear = () => {
    clearManualConfig();
  };

  const copyRepairSql = () => {
    const repairSql = `
-- REGESTRA DATABASE REPAIR SCRIPT
-- Run this in your Supabase SQL Editor to fix 'Schema cache is stale' (PGRST204) errors.

-- 1. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Force a schema cache reload
NOTIFY pgrst, 'reload schema';

-- 3. Success confirmation
SELECT 'Database schema successfully refreshed. You can now refresh your app.' as result;
    `.trim();

    navigator.clipboard.writeText(repairSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show debug button if not configured OR if it was manually configured
  if (isSupabaseConfigured && !isManual) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[9999]">
        <Button 
            variant={isSupabaseConfigured ? "outline" : "destructive"} 
            size="sm" 
            className="rounded-full shadow-lg text-xs gap-2 border-2 bg-white"
            onClick={() => setIsOpen(true)}
        >
            <Database className="w-3 h-3" />
            {isSupabaseConfigured ? 'DB Connected (Manual)' : 'Connect DB'}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-slide-up border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-600" /> Supabase Configuration
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {isSupabaseConfigured ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
                            <p className="font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Connected to Supabase
                            </p>
                            <p className="mt-1 text-xs opacity-75 truncate">{localStorage.getItem('SB_URL')}</p>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                Fix Sync Errors (PGRST204)
                            </div>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                If you see "API cache is out of date", PostgREST needs to be reloaded. Run the repair script in your Supabase SQL Editor.
                            </p>
                            <Button 
                                onClick={copyRepairSql} 
                                variant="outline" 
                                size="sm" 
                                className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100"
                            >
                                {copied ? <><ClipboardCheck className="w-4 h-4 mr-2" /> Copied!</> : <><Save className="w-4 h-4 mr-2" /> Copy Repair SQL</>}
                            </Button>
                        </div>

                        <Button onClick={handleClear} variant="ghost" className="w-full text-red-600 hover:bg-red-50 rounded-xl">
                            <Trash2 className="w-4 h-4 mr-2" /> Disconnect & Reset
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Connect to your own Supabase instance. These credentials are saved locally in your browser.
                        </p>
                        
                        <div className="space-y-2">
                            <Label>Project URL</Label>
                            <Input 
                                placeholder="https://xyz.supabase.co" 
                                value={url} 
                                onChange={e => setUrl(e.target.value)} 
                                className="rounded-xl"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Anon Key</Label>
                            <Input 
                                type="password"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." 
                                value={key} 
                                onChange={e => setKey(e.target.value)} 
                                className="rounded-xl"
                            />
                        </div>

                        <Button onClick={handleSave} className="w-full rounded-xl h-12 shadow-md" disabled={!url || !key}>
                            <Save className="w-4 h-4 mr-2" /> Save & Reload
                        </Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </>
  );
};
