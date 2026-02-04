import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  doc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  LayoutDashboard, Plus, History, 
  TrendingDown, TrendingUp, Store, Tag, 
  Trash2, ScanLine, X, Search, ChevronRight, Wallet, MapPin
} from 'lucide-react';

// ==========================================
// 🔑 CONFIGURAÇÃO DO FIREBASE (DO .env)
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const APP_COLLECTION_ID = 'meu-preco-tracker-v1';

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SUPERMERCADOS = [
  { nome: "Rede Vivo", cor: "red" },
  { nome: "Rede Super", cor: "orange" },
  { nome: "Nicolini", cor: "green" },
  { nome: "Beltrame", cor: "blue" }
];

// ==========================================
// ESTILOS GLOBAIS
// ==========================================
const styles = {
  glass: "bg-slate-900/60 backdrop-blur-xl border border-white/5 shadow-xl",
  glassCard: "bg-slate-800/40 backdrop-blur-md border border-white/5 hover:bg-slate-800/60 transition-all duration-300",
  gradientText: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400",
  primaryBtn: "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-900/20",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-100 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all placeholder:text-slate-600",
};

// ==========================================
// COMPONENTES DE UI
// ==========================================

const Header = ({ userId }) => (
  <header className={`sticky top-0 z-30 px-6 py-4 ${styles.glass}`}>
    <div className="max-w-md mx-auto flex justify-between items-center">
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${styles.gradientText}`}>
          PreçoTracker
        </h1>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
          Gerenciador Inteligente
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold">ID</span>
          <span className="text-xs text-slate-400 font-mono bg-slate-950/50 px-2 py-1 rounded-md border border-white/5">
            {userId?.substring(0, 6) || '...'}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 p-[2px]">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <span className="font-bold text-sm text-white">
              {userId ? userId[0].toUpperCase() : '?'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>
);

const StatCard = ({ label, value, icon: Icon, trend }) => (
  <div className={`p-5 rounded-3xl flex flex-col justify-between h-32 ${styles.glassCard}`}>
    <div className="flex justify-between items-start">
      <div className="p-2 rounded-xl bg-slate-950/50 text-slate-400 border border-white/5">
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
          {trend === 'up' ? '↑ High' : '↓ Low'}
        </span>
      )}
    </div>
    <div>
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">{label}</span>
      <span className="text-xl font-bold text-slate-100 tracking-tight">{value}</span>
    </div>
  </div>
);

const NavButton = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all duration-300 relative group ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-500 w-1 h-1 rounded-full transition-all duration-300 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></div>
    <div className={`transition-transform duration-300 ${active ? '-translate-y-1' : 'group-hover:-translate-y-1'}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
  </button>
);

// ==========================================
// APP PRINCIPAL
// ==========================================

export default function App() {
  const [user, setUser] = useState(null);
  const [precos, setPrecos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const scannerRef = useRef(null); // Ref para controlar instância do scanner
  
  const [formData, setFormData] = useState({
    produto: '',
    supermercado: 'Rede Vivo',
    clube: 'Sem Clube',
    preco: ''
  });

  // Carrega Script do Scanner
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    script.onload = () => setScannerLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Autenticação
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Dados do Firestore
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'precos');
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lista.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPrecos(lista);
      setLoading(false);
    }, (error) => {
      console.error("Erro detalhado do Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Lógica do Scanner CORRIGIDA
  useEffect(() => {
    if (view === 'scan' && scannerLoaded && window.Html5QrcodeScanner && !scannerRef.current) {
      // Pequeno delay para garantir que a DIV #reader foi renderizada
      const timer = setTimeout(() => {
        try {
          const scanner = new window.Html5QrcodeScanner("reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true
          });
          
          scannerRef.current = scanner;

          scanner.render((text) => {
            setFormData(prev => ({ ...prev, produto: text }));
            // Limpa com segurança antes de trocar de tela
            scanner.clear().then(() => {
                scannerRef.current = null;
                setView('add');
            }).catch(err => {
                console.error("Erro ao limpar scanner", err);
                scannerRef.current = null;
                setView('add');
            });
          }, (errorMessage) => {
            // console.log(errorMessage); // Ignorar erros de frame vazio
          });
        } catch (e) {
          console.error("Erro ao iniciar scanner:", e);
        }
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }

    // Cleanup ao sair da tela 'scan'
    return () => {
      if (view !== 'scan' && scannerRef.current) {
        try {
          scannerRef.current.clear().catch(e => console.error(e));
          scannerRef.current = null;
        } catch(e) {
          // Ignora erro se já estiver limpo
        }
      }
    };
  }, [view, scannerLoaded]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.produto || !formData.preco) return;

    try {
      const colRef = collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'precos');
      await addDoc(colRef, {
        ...formData,
        preco: parseFloat(formData.preco),
        createdAt: serverTimestamp(),
        userId: user.uid,
        data: new Date().toLocaleDateString('pt-BR')
      });
      setFormData({ produto: '', supermercado: 'Rede Vivo', clube: 'Sem Clube', preco: '' });
      setView('lista');
    } catch (err) { console.error("Erro salvar:", err); }
  };

  const stats = {
    total: precos.length,
    media: precos.length ? (precos.reduce((acc, curr) => acc + curr.preco, 0) / precos.length).toFixed(2) : "0.00",
    menor: precos.length ? Math.min(...precos.map(p => p.preco)).toFixed(2) : "0.00",
    maior: precos.length ? Math.max(...precos.map(p => p.preco)).toFixed(2) : "0.00"
  };

  const filtered = precos.filter(p => 
    p.produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-400 font-medium animate-pulse">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-32 relative selection:bg-blue-500/30">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]"></div>
      </div>

      <Header userId={user?.uid} />

      <main className="max-w-md mx-auto p-6 relative z-10">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Média Geral" value={`R$ ${stats.media}`} icon={Wallet} />
              <StatCard label="Registros" value={stats.total} icon={Tag} />
              <StatCard label="Mais Barato" value={`R$ ${stats.menor}`} icon={TrendingDown} trend="down" />
              <StatCard label="Mais Caro" value={`R$ ${stats.maior}`} icon={TrendingUp} trend="up" />
            </div>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                        <History className="text-blue-500" size={20} /> Recentes
                    </h2>
                    {precos.length > 0 && (
                        <button onClick={() => setView('lista')} className="text-xs font-bold text-blue-400">VER TUDO</button>
                    )}
                </div>
                {precos.slice(0, 4).map(p => (
                  <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl group ${styles.glassCard}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-700/50 text-slate-400`}>
                        <Store size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{p.produto}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{p.supermercado}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-100">R$ {p.preco.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">{p.data}</div>
                    </div>
                  </div>
                ))}
                {precos.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                    <p className="text-slate-400 text-sm font-medium">Nenhum preço registrado.</p>
                    <button onClick={() => setView('add')} className="mt-4 text-blue-400 text-sm font-bold hover:underline">Adicionar o primeiro</button>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'lista' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                className={`${styles.input} pl-12`}
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-3">
              {filtered.map(p => (
                <div key={p.id} className={`p-4 rounded-2xl relative group overflow-hidden ${styles.glassCard}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-950/30 px-2 py-1 rounded-md">{p.data}</span>
                    {p.clube === 'Com Clube' && <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">CLUBE</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-100 text-lg leading-tight mb-1">{p.produto}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400"><Store size={12} /> {p.supermercado}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">R$ {p.preco.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'precos', p.id))} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-all">
                      <Trash2 size={18} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOJAS VIEW (NOVA) */}
        {view === 'lojas' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Store className="text-blue-500" /> Supermercados
            </h2>
            <div className="grid gap-4">
                {SUPERMERCADOS.map((loja, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl flex items-center gap-4 ${styles.glassCard}`}>
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {loja.nome[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-100">{loja.nome}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin size={10} /> Localização não definida
                            </p>
                        </div>
                        <ChevronRight className="text-slate-600" />
                    </div>
                ))}
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-sm text-blue-300 text-center">
                    Em breve: Mapa de ofertas e comparação por loja.
                </p>
            </div>
          </div>
        )}

        {/* ADD VIEW */}
        {view === 'add' && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className={`p-6 rounded-3xl ${styles.glass}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-100">
                  <div className="p-2 bg-blue-600 rounded-lg"><Plus size={20} className="text-white" /></div>
                  Novo Preço
                </h2>
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Produto</label>
                  <div className="flex gap-3">
                    <input required className={styles.input} placeholder="Nome do produto" value={formData.produto} onChange={e => setFormData({...formData, produto: e.target.value})} />
                    <button type="button" onClick={() => setView('scan')} className="bg-slate-800 border border-slate-700 hover:border-blue-500/50 text-blue-400 p-4 rounded-2xl transition-all active:scale-95"><ScanLine size={24} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mercado</label>
                    <div className="relative">
                      <select className={`${styles.input} appearance-none`} value={formData.supermercado} onChange={e => setFormData({...formData, supermercado: e.target.value})}>
                        {SUPERMERCADOS.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><ChevronRight size={16} className="rotate-90" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Preço</label>
                    <input required type="number" step="0.01" className={`${styles.input} font-mono font-bold text-lg`} placeholder="0.00" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Oferta</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Sem Clube", "Com Clube"].map(c => (
                      <button key={c} type="button" onClick={() => setFormData({...formData, clube: c})} className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${formData.clube === c ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm mt-4 active:scale-[0.98] transition-all ${styles.primaryBtn}`}>Salvar Registro</button>
              </form>
            </div>
          </div>
        )}

        {/* SCAN VIEW (Corrigido) */}
        {view === 'scan' && (
          <div className="animate-in fade-in duration-300 flex flex-col h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Scanner</h2>
              <button onClick={() => {
                  if (scannerRef.current) scannerRef.current.clear().catch(console.error);
                  setView('add');
              }} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X /></button>
            </div>
            
            <div className="flex-1 rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-2xl relative bg-black">
              {/* O ID 'reader' precisa existir e ter tamanho definido */}
              <div id="reader" className="w-full h-full bg-black"></div>
              
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-blue-500/30 rounded-3xl relative">
                  {/* ... (animação mantida) ... */}
                  <div style={{position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: 'rgba(59, 130, 246, 0.8)', boxShadow: '0 0 20px rgba(59, 130, 246, 1)', animation: 'scan 2s infinite ease-in-out'}}></div>
                  <style>{`@keyframes scan { 0% { transform: translateY(-100px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100px); opacity: 0; } }`}</style>
                </div>
                <p className="mt-8 text-sm font-medium text-slate-300 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">Aponte para o código de barras</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <nav className={`flex justify-around items-center p-2 rounded-3xl ${styles.glass} shadow-2xl shadow-black/50`}>
          <NavButton active={view === 'dashboard'} icon={<LayoutDashboard size={20}/>} label="Home" onClick={() => setView('dashboard')} />
          <NavButton active={view === 'lista'} icon={<History size={20}/>} label="Lista" onClick={() => setView('lista')} />
          <div className="relative -top-8 group">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <button onClick={() => setView('add')} className="relative w-16 h-16 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform active:scale-90 border-4 border-[#0f172a]"><Plus size={32} /></button>
          </div>
          <NavButton active={view === 'scan'} icon={<ScanLine size={20}/>} label="Scan" onClick={() => setView('scan')} />
          <NavButton active={view === 'lojas'} icon={<Store size={20}/>} label="Lojas" onClick={() => setView('lojas')} />
        </nav>
      </div>
    </div>
  );
}