import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  doc, deleteDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  LayoutDashboard, Plus, History, 
  TrendingDown, TrendingUp, Store, Tag, 
  Trash2, ScanLine, X, Search, ChevronRight, Wallet, MapPin, Pencil, BarChart3, Save
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

// Cores disponíveis para as lojas
const STORE_COLORS = [
  { id: 'red', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  { id: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
  { id: 'green', bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
  { id: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500' },
  { id: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  { id: 'violet', bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500' },
  { id: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500' },
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
  const [lojas, setLojas] = useState([]); // Estado para as lojas
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdutoAnalise, setSelectedProdutoAnalise] = useState(''); // Para o dashboard analítico
  
  // Estado do formulário de Preços
  const [formData, setFormData] = useState({
    produto: '',
    supermercado: '', // Vai ser populado com a primeira loja ou vazio
    clube: 'Sem Clube',
    preco: ''
  });

  // Estado de edição de Preço
  const [isEditingPreco, setIsEditingPreco] = useState(false);
  const [precoEditId, setPrecoEditId] = useState(null);

  // Estado do formulário de Lojas (Adicionar/Editar)
  const [isEditingLoja, setIsEditingLoja] = useState(false);
  const [lojaFormData, setLojaFormData] = useState({
    id: null,
    nome: '',
    endereco: '',
    cor: 'blue'
  });

  // Autenticação
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Busca PREÇOS do Firestore
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'precos');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lista.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPrecos(lista);
      setLoading(false); // Só para loading aqui para garantir que algo carregou
    });
    return () => unsubscribe();
  }, [user]);

  // Busca LOJAS do Firestore
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'lojas');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
      setLojas(lista);
      
      // Se tiver lojas e o formData estiver vazio, preenche o default
      if(lista.length > 0 && formData.supermercado === '') {
        setFormData(prev => ({ ...prev, supermercado: lista[0].nome }));
      }
    });
    return () => unsubscribe();
  }, [user]);

  // --- Handlers de PREÇO ---
  const handleAddPreco = async (e) => {
    e.preventDefault();
    if (!formData.produto || !formData.preco || !formData.supermercado) return;

    try {
      const colRef = collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'precos');
      
      if (isEditingPreco && precoEditId) {
        // Editar preço sem modificar a data
        const docRef = doc(colRef, precoEditId);
        await updateDoc(docRef, {
          produto: formData.produto,
          preco: parseFloat(formData.preco),
          supermercado: formData.supermercado,
          clube: formData.clube
        });
        setIsEditingPreco(false);
        setPrecoEditId(null);
      } else {
        // Criar novo preço
        await addDoc(colRef, {
          ...formData,
          preco: parseFloat(formData.preco),
          createdAt: serverTimestamp(),
          userId: user.uid,
          data: new Date().toLocaleDateString('pt-BR')
        });
      }
      setFormData(prev => ({ ...prev, produto: '', preco: '' }));
      setView('lista');
    } catch (err) { console.error("Erro salvar preço:", err); }
  };

  const handleEditPreco = (preco) => {
    setFormData({
      produto: preco.produto,
      supermercado: preco.supermercado,
      clube: preco.clube,
      preco: preco.preco.toString()
    });
    setPrecoEditId(preco.id);
    setIsEditingPreco(true);
    setView('add');
  };

  const handleDeletePreco = async (id) => {
    if (!window.confirm("Excluir este registro de preço?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'precos', id));
    } catch (err) { console.error("Erro excluir preço:", err); }
  };

  // --- Handlers de LOJA ---
  const handleSaveLoja = async (e) => {
    e.preventDefault();
    if (!lojaFormData.nome) return;

    const colRef = collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'lojas');

    try {
      if (isEditingLoja && lojaFormData.id) {
        // Editar
        const docRef = doc(colRef, lojaFormData.id);
        await updateDoc(docRef, {
            nome: lojaFormData.nome,
            endereco: lojaFormData.endereco,
            cor: lojaFormData.cor
        });
      } else {
        // Criar Novo
        await addDoc(colRef, {
            nome: lojaFormData.nome,
            endereco: lojaFormData.endereco,
            cor: lojaFormData.cor,
            userId: user.uid,
            createdAt: serverTimestamp()
        });
      }
      // Resetar form
      setLojaFormData({ id: null, nome: '', endereco: '', cor: 'blue' });
      setIsEditingLoja(false);
    } catch (err) { console.error("Erro salvar loja:", err); }
  };

  const handleEditLojaClick = (loja) => {
    setLojaFormData({ id: loja.id, nome: loja.nome, endereco: loja.endereco, cor: loja.cor || 'blue' });
    setIsEditingLoja(true);
  };

  const handleDeleteLoja = async (id) => {
    if(!window.confirm("Tem certeza? Isso não apaga os preços antigos deste mercado, mas remove ele da lista.")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'lojas', id));
    } catch (err) { console.error("Erro excluir loja:", err); }
  };

  // --- Cálculos ---
  const stats = {
    total: precos.length,
    media: precos.length ? (precos.reduce((acc, curr) => acc + curr.preco, 0) / precos.length).toFixed(2) : "0.00",
    menor: precos.length ? Math.min(...precos.map(p => p.preco)).toFixed(2) : "0.00",
    maior: precos.length ? Math.max(...precos.map(p => p.preco)).toFixed(2) : "0.00"
  };

  // Produtos únicos ordenados alfabeticamente
  const produtosUnicos = Array.from(new Set(precos.map(p => p.produto))).sort();

  // Preços mais recentes de um produto por mercado
  const getPrecosRecentes = (produto) => {
    const precosDoP = precos.filter(p => p.produto === produto);
    const porMercado = {};
    
    precosDoP.forEach(p => {
      if (!porMercado[p.supermercado] || 
          new Date(porMercado[p.supermercado].createdAt?.toDate?.() || 0) < 
          new Date(p.createdAt?.toDate?.() || 0)) {
        porMercado[p.supermercado] = p;
      }
    });
    
    return Object.values(porMercado).sort((a, b) => a.preco - b.preco);
  };

  const filtered = precos.filter(p => 
    p.produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0f172a] to-[#0f172a]"></div>
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin z-10"></div>
      <p className="mt-4 text-slate-400 font-medium z-10 animate-pulse">Carregando seus dados...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-32 relative selection:bg-blue-500/30">
      
      {/* Background Ambience */}
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
                        <button onClick={() => setView('lista')} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">VER TUDO</button>
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
                placeholder="Buscar produto, mercado..."
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
                    <button onClick={() => handleEditPreco(p)} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                      <Pencil size={18} /> Editar
                    </button>
                    <button onClick={() => handleDeletePreco(p.id)} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-all">
                      <Trash2 size={18} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALISE VIEW - Dashboard Comparativo */}
        {view === 'analise' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-blue-500" /> Comparação de Preços
            </h2>

            {/* Seletor de Produto */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecione um Produto</label>
              <div className="relative">
                <select 
                  value={selectedProdutoAnalise} 
                  onChange={(e) => setSelectedProdutoAnalise(e.target.value)}
                  className={`${styles.input} appearance-none`}
                >
                  <option value="">Escolha um produto...</option>
                  {produtosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Comparação */}
            {selectedProdutoAnalise ? (
              <div className="space-y-4">
                {getPrecosRecentes(selectedProdutoAnalise).length > 0 ? (
                  <>
                    {/* Resumo */}
                    <div className={`p-4 rounded-2xl ${styles.glass}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Mais Barato</p>
                          <p className="text-2xl font-black text-green-400">
                            R$ {Math.min(...getPrecosRecentes(selectedProdutoAnalise).map(p => p.preco)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Mais Caro</p>
                          <p className="text-2xl font-black text-red-400">
                            R$ {Math.max(...getPrecosRecentes(selectedProdutoAnalise).map(p => p.preco)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-slate-500">Diferença</p>
                        <p className="text-lg font-bold text-slate-100">
                          R$ {(Math.max(...getPrecosRecentes(selectedProdutoAnalise).map(p => p.preco)) - Math.min(...getPrecosRecentes(selectedProdutoAnalise).map(p => p.preco))).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Lista de Mercados */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Preços por Mercado</h3>
                      {getPrecosRecentes(selectedProdutoAnalise).map((p, idx) => {
                        const menorPreco = Math.min(...getPrecosRecentes(selectedProdutoAnalise).map(pp => pp.preco));
                        const isMenor = p.preco === menorPreco;
                        
                        return (
                          <div key={p.id} className={`p-4 rounded-2xl ${styles.glassCard} ${isMenor ? 'ring-2 ring-green-500/50' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${STORE_COLORS.find(c => c.id === (lojas.find(l => l.nome === p.supermercado)?.cor))?.bg || 'bg-slate-700'}`}>
                                  {p.supermercado[0].toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-100">{p.supermercado}</h4>
                                  <p className="text-xs text-slate-500">{p.data}</p>
                                </div>
                              </div>
                              {isMenor && <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">MELHOR PREÇO</span>}
                            </div>
                            <div className="flex justify-between items-center">
                              <p className={`text-2xl font-black ${isMenor ? 'text-green-400' : 'text-slate-100'}`}>R$ {p.preco.toFixed(2)}</p>
                              {p.clube === 'Com Clube' && <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">COM CLUBE</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <p className="text-slate-500">Nenhum preço registrado para este produto.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                <p className="text-slate-500">Selecione um produto para comparar preços nos mercados.</p>
              </div>
            )}
          </div>
        )}

        {/* LOJAS VIEW (Gerenciador Completo) */}
        {view === 'lojas' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Store className="text-blue-500" /> Meus Mercados
            </h2>

            {/* Form de Adicionar/Editar */}
            <form onSubmit={handleSaveLoja} className={`p-5 rounded-3xl ${styles.glass} space-y-4`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        {isEditingLoja ? 'Editar Mercado' : 'Novo Mercado'}
                    </h3>
                    {isEditingLoja && (
                        <button type="button" onClick={() => { setIsEditingLoja(false); setLojaFormData({ id: null, nome: '', endereco: '', cor: 'blue' }); }} className="text-xs text-red-400 hover:underline">
                            Cancelar
                        </button>
                    )}
                </div>
                
                <input 
                    required 
                    className={styles.input} 
                    placeholder="Nome do Mercado (ex: Zaffari)" 
                    value={lojaFormData.nome}
                    onChange={e => setLojaFormData({...lojaFormData, nome: e.target.value})}
                />
                
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        className={`${styles.input} pl-12 py-3 text-sm`} 
                        placeholder="Endereço ou Bairro (opcional)" 
                        value={lojaFormData.endereco}
                        onChange={e => setLojaFormData({...lojaFormData, endereco: e.target.value})}
                    />
                </div>

                {/* Seleção de Cor */}
                <div className="flex gap-2 justify-between bg-slate-950/30 p-3 rounded-2xl border border-slate-800">
                    {STORE_COLORS.map((color) => (
                        <button
                            key={color.id}
                            type="button"
                            onClick={() => setLojaFormData({...lojaFormData, cor: color.id})}
                            className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${color.bg} ${lojaFormData.cor === color.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
                        />
                    ))}
                </div>

                <button 
                    type="submit" 
                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs mt-2 flex items-center justify-center gap-2 ${isEditingLoja ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white shadow-lg transition-all`}
                >
                    {isEditingLoja ? <><Save size={16}/> Salvar Alterações</> : <><Plus size={16}/> Adicionar Mercado</>}
                </button>
            </form>

            {/* Lista de Lojas */}
            <div className="grid gap-3">
                {lojas.map((loja) => {
                    const colorTheme = STORE_COLORS.find(c => c.id === loja.cor) || STORE_COLORS[5];
                    return (
                        <div key={loja.id} className={`p-4 rounded-2xl flex items-center gap-4 group ${styles.glassCard} relative overflow-hidden`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${colorTheme.bg}`}>
                                {loja.nome[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-slate-100 truncate">{loja.nome}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                    <MapPin size={10} /> {loja.endereco || 'Sem endereço'}
                                </p>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => handleEditLojaClick(loja)} className="p-2 bg-slate-800 rounded-lg text-blue-400 hover:bg-slate-700 transition-colors">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleDeleteLoja(loja.id)} className="p-2 bg-slate-800 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {lojas.length === 0 && (
                    <div className="text-center p-8 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                        <p className="text-slate-500 text-sm">Nenhum mercado cadastrado.</p>
                        <p className="text-xs text-slate-600">Adicione um acima para começar.</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* ADD VIEW (Atualizado para usar lista dinâmica) */}
        {view === 'add' && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className={`p-6 rounded-3xl ${styles.glass}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-100">
                  <div className="p-2 bg-blue-600 rounded-lg"><Plus size={20} className="text-white" /></div>
                  {isEditingPreco ? 'Editar Preço' : 'Novo Preço'}
                </h2>
                <button onClick={() => { setView('dashboard'); setIsEditingPreco(false); setPrecoEditId(null); }} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              
              {lojas.length === 0 ? (
                  <div className="text-center py-10">
                      <p className="text-slate-400 mb-4">Você precisa cadastrar um mercado antes.</p>
                      <button onClick={() => setView('lojas')} className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-sm text-white">Ir para Mercados</button>
                  </div>
              ) : (
                <form onSubmit={handleAddPreco} className="space-y-6">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Produto</label>
                    <input required className={styles.input} placeholder="Nome do produto" value={formData.produto} onChange={e => setFormData({...formData, produto: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mercado</label>
                        <div className="relative">
                        <select className={`${styles.input} appearance-none`} value={formData.supermercado} onChange={e => setFormData({...formData, supermercado: e.target.value})}>
                            <option value="" disabled>Selecione...</option>
                            {lojas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
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
              )}
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
            <button onClick={() => { setView('add'); setIsEditingPreco(false); setPrecoEditId(null); setFormData({ produto: '', supermercado: '', clube: 'Sem Clube', preco: '' }); }} className="relative w-16 h-16 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform active:scale-90 border-4 border-[#0f172a]"><Plus size={32} /></button>
          </div>
          <NavButton active={view === 'analise'} icon={<BarChart3 size={20}/>} label="Análise" onClick={() => setView('analise')} />
          <NavButton active={view === 'lojas'} icon={<Store size={20}/>} label="Lojas" onClick={() => setView('lojas')} />
        </nav>
      </div>
    </div>
  );
}