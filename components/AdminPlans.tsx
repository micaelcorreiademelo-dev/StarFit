import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const AdminPlans: React.FC = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const [platformPlans, setPlatformPlans] = useState<any[]>([]);
  
  // Plan form
  const [isEditingPlan, setIsEditingPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', price: '', period: '/mês', students: '', features: '', color: 'border-white/10' });

  useEffect(() => {
    // Escutar platformPlans
    const unsubPlans = onSnapshot(collection(db, 'platformPlans'), (snapshot) => {
      const plansList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlatformPlans(plansList);
      setLoadingConfig(false);
    }, (error) => {
      console.error(error);
      setLoadingConfig(false);
    });

    // Escutar trainers info para assinaturas (opcional na view, manteremos simplificado)
    const unsubTrainers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'TRAINER')), (snapshot) => {
      const trainersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrainers(trainersList);
    });

    return () => {
      unsubPlans();
      unsubTrainers();
    };
  }, []);

  const handleSavePlan = async () => {
    const featuresArray = planForm.features.split('\n').filter(f => f.trim() !== '');
    const planData = {
      name: planForm.name,
      price: planForm.price,
      period: planForm.period,
      students: planForm.students,
      features: featuresArray,
      color: planForm.color
    };

    if (isEditingPlan) {
      await updateDoc(doc(db, 'platformPlans', isEditingPlan), planData);
    } else {
      await addDoc(collection(db, 'platformPlans'), planData);
    }
    
    setPlanForm({ name: '', price: '', period: '/mês', students: '', features: '', color: 'border-white/10' });
    setIsEditingPlan(null);
  };

  const handleEditPlan = (plan: any) => {
    setIsEditingPlan(plan.id);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      students: plan.students,
      features: (plan.features || []).join('\n'),
      color: plan.color || 'border-white/10'
    });
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Deletar plano?')) {
      await deleteDoc(doc(db, 'platformPlans', id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Gestão de Planos</h1>
          <p className="text-text-secondary mt-2">Crie e edite os planos oferecidos aos personais.</p>
        </div>
      </header>

      <section className="bg-card-dark rounded-2xl border border-border-dark p-6">
        <h2 className="text-white text-xl font-bold mb-6">{isEditingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            placeholder="Nome (Ex: Starter)" 
            className="bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})}
          />
          <input 
            placeholder="Preço (Ex: R$ 29,90)" 
            className="bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})}
          />
          <input 
            placeholder="Intervalo (Ex: /mês)" 
            className="bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            value={planForm.period} onChange={e => setPlanForm({...planForm, period: e.target.value})}
          />
          <input 
            placeholder="Limite de alunos (Ex: Até 10 alunos)" 
            className="bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            value={planForm.students} onChange={e => setPlanForm({...planForm, students: e.target.value})}
          />
          <textarea 
            placeholder="Benefícios (um por linha)" 
            rows={4}
            className="bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none md:col-span-2 resize-none"
            value={planForm.features} onChange={e => setPlanForm({...planForm, features: e.target.value})}
          />
          <div className="md:col-span-2">
            <label className="text-text-secondary text-sm mb-2 block">Estilo da Borda</label>
            <select 
              className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none"
              value={planForm.color} onChange={e => setPlanForm({...planForm, color: e.target.value})}
            >
              <option value="border-white/10">Padrão</option>
              <option value="border-primary shadow-[0_0_20px_rgba(19,236,91,0.1)]">Destaque (Verde)</option>
              <option value="border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">Premium (Azul)</option>
            </select>
          </div>
          
          <div className="md:col-span-2 flex gap-4 mt-2">
            <button onClick={handleSavePlan} disabled={!planForm.name} className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl hover:brightness-110 disabled:opacity-50">
              {isEditingPlan ? 'Salvar Alterações' : 'Adicionar Plano'}
            </button>
            {isEditingPlan && (
              <button 
                onClick={() => { setIsEditingPlan(null); setPlanForm({ name: '', price: '', period: '/mês', students: '', features: '', color: 'border-white/10' }); }}
                className="px-6 py-3 border border-border-dark rounded-xl text-white font-bold hover:bg-white/5"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loadingConfig ? <p className="text-text-secondary">Carregando planos...</p> : platformPlans.map(plan => (
          <div key={plan.id} className={`bg-card-dark rounded-2xl p-6 border-2 flex flex-col gap-4 relative ${plan.color || 'border-white/10'}`}>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => handleEditPlan(plan)} className="text-text-secondary hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
              <button onClick={() => handleDeletePlan(plan.id)} className="text-text-secondary hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
            </div>
            <h3 className="text-2xl font-black text-white">{plan.name}</h3>
            <div>
              <span className="text-3xl font-black text-white">{plan.price}</span>
              <span className="text-text-secondary ml-1">{plan.period}</span>
            </div>
            <p className="font-bold text-primary">{plan.students}</p>
            <ul className="flex flex-col gap-2 mt-4">
              {(plan.features || []).map((f: string, i: number) => (
                <li key={i} className="text-text-secondary text-sm flex gap-2 items-start">
                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminPlans;
