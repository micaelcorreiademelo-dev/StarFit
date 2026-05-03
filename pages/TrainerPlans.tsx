import React, { useState, useEffect } from "react";
import { trainerService } from "../services/trainerService";
import { User, Plan } from "../types";

interface TrainerPlansProps {
  user: User;
}

const TrainerPlans: React.FC<TrainerPlansProps> = ({ user }) => {
  const username = (user.username || user.id).replace('@', '');
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      const data = await trainerService.getTrainerData(username);
      setPlans(data.plans || []);
      setLoading(false);
    };
    loadPlans();
  }, [username]);

  const [isEditing, setIsEditing] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [features, setFeatures] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [displayOnLandingPage, setDisplayOnLandingPage] = useState(true);
  const [showPriceOnLandingPage, setShowPriceOnLandingPage] = useState(true);
  const [hiddenGlobal, setHiddenGlobal] = useState(false);
  const [allowHiddenRenewal, setAllowHiddenRenewal] = useState(false);

  const handleEdit = (plan: Plan) => {
    setIsEditing(plan.id);
    setName(plan.name);
    setPrice(plan.price);
    setDurationDays(plan.durationDays || 30);
    setFeatures(plan.features.join("\n"));
    setIsPopular(plan.isPopular || false);
    setDisplayOnLandingPage(plan.displayOnLandingPage !== false);
    setShowPriceOnLandingPage(plan.showPriceOnLandingPage !== false);
    setHiddenGlobal(plan.hiddenGlobal || false);
    setAllowHiddenRenewal(plan.allowHiddenRenewal || false);
  };

  const handleSave = async () => {
    const featureList = features.split("\n").filter((f) => f.trim() !== "");

    let updatedPlans = [];
    if (isEditing) {
      updatedPlans = plans.map((p) =>
        p.id === isEditing
          ? {
              ...p,
              name,
              price,
              durationDays: Number(durationDays),
              features: featureList,
              isPopular,
              displayOnLandingPage,
              showPriceOnLandingPage,
              hiddenGlobal,
              allowHiddenRenewal,
            }
          : p,
      );
    } else {
      const newPlan: Plan = {
        id: Date.now(),
        name,
        price,
        durationDays: Number(durationDays),
        features: featureList,
        isPopular,
        displayOnLandingPage,
        showPriceOnLandingPage,
        hiddenGlobal,
        allowHiddenRenewal,
      };
      updatedPlans = [...plans, newPlan];
    }
    
    setPlans(updatedPlans);
    await trainerService.savePlans(username, updatedPlans);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este plano?")) {
      const updatedPlans = plans.filter((p) => p.id !== id);
      setPlans(updatedPlans);
      await trainerService.savePlans(username, updatedPlans);
      if (isEditing === id) resetForm();
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setName("");
    setPrice("");
    setDurationDays(30);
    setFeatures("");
    setIsPopular(false);
    setDisplayOnLandingPage(true);
    setShowPriceOnLandingPage(true);
    setHiddenGlobal(false);
    setAllowHiddenRenewal(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Meus Planos (Alunos)
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Crie e gerencie os planos de assinatura. A validade de acesso do aluno será definida pelo tempo que você configurar em cada plano.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário de Criação/Edição */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-card-dark rounded-2xl border border-divider-dark p-6">
          <h2 className="text-white text-xl font-bold">
            {isEditing ? "Editar Plano" : "Criar Novo Plano"}
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">
                Nome do Plano
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Plano Ouro"
                className="w-full bg-background-dark border border-divider-dark rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">
                  Preço
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: R$150"
                  className="w-full bg-background-dark border border-divider-dark rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary"
                />
              </div>
              <div className="w-1/3">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">
                  Duração (Dias)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  placeholder="30"
                  className="w-full bg-background-dark border border-divider-dark rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">
                Benefícios (Um por linha)
              </label>
              <textarea
                rows={4}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder={"Planilha Mensal\nSuporte 24h\nAvaliação"}
                className="w-full bg-background-dark border border-divider-dark rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary resize-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${isPopular ? "bg-primary" : "bg-background-dark border border-divider-dark"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${isPopular ? "translate-x-5" : "translate-x-1"}`}
                  ></div>
                </div>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Destacar como "Mais Popular"
                </span>
              </label>

              <hr className="border-divider-dark my-1" />

              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <input
                  type="checkbox"
                  checked={displayOnLandingPage}
                  onChange={(e) => setDisplayOnLandingPage(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${displayOnLandingPage ? "bg-primary" : "bg-background-dark border border-divider-dark"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${displayOnLandingPage ? "translate-x-5" : "translate-x-1"}`}
                  ></div>
                </div>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Exibir plano na landing page
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <input
                  type="checkbox"
                  checked={showPriceOnLandingPage}
                  onChange={(e) => setShowPriceOnLandingPage(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${showPriceOnLandingPage ? "bg-primary" : "bg-background-dark border border-divider-dark"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${showPriceOnLandingPage ? "translate-x-5" : "translate-x-1"}`}
                  ></div>
                </div>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Exibir valor do plano na landing page
                </span>
              </label>

              <hr className="border-divider-dark my-1" />

              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <input
                  type="checkbox"
                  checked={hiddenGlobal}
                  onChange={(e) => setHiddenGlobal(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${hiddenGlobal ? "bg-red-500" : "bg-background-dark border border-divider-dark"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${hiddenGlobal ? "translate-x-5" : "translate-x-1"}`}
                  ></div>
                </div>
                <span className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">
                  Ocultar plano globalmente
                </span>
              </label>

              {hiddenGlobal && (
                <label className="flex items-center gap-3 cursor-pointer group w-max ml-8">
                  <input
                    type="checkbox"
                    checked={allowHiddenRenewal}
                    onChange={(e) => setAllowHiddenRenewal(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${allowHiddenRenewal ? "bg-primary" : "bg-background-dark border border-divider-dark"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${allowHiddenRenewal ? "translate-x-5" : "translate-x-1"}`}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">
                    Permitir renovação do plano oculto
                  </span>
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={!name || !price}
                className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(19,236,91,0.2)]"
              >
                {isEditing ? "Salvar Alterações" : "Criar Plano"}
              </button>
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="px-6 bg-background-dark text-text-secondary font-bold py-3 rounded-xl border border-divider-dark hover:text-white transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-card-dark rounded-2xl p-6 flex flex-col transition-all relative overflow-hidden group hover:-translate-y-1 ${plan.isPopular ? "border-2 border-primary shadow-[0_0_20px_rgba(19,236,91,0.05)]" : "border border-divider-dark hover:border-primary/50"}`}
              >
                {/* Actions overlay */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="size-8 rounded-lg bg-background-dark flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary border border-divider-dark transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="size-8 rounded-lg bg-background-dark flex items-center justify-center text-text-secondary hover:text-red-500 hover:border-red-500 border border-divider-dark transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>

                {plan.isPopular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-background-dark text-[10px] font-black px-4 py-1.5 uppercase tracking-wider rounded-bl-xl">
                      Mais Popular
                    </div>
                  </div>
                )}

                <h3 className="text-white text-xl font-black mt-2 pr-20">
                  {plan.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="material-symbols-outlined text-text-secondary text-sm">schedule</span>
                   <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">{plan.durationDays} Dias de acesso</span>
                </div>

                <div className="flex items-baseline gap-1 my-6">
                  <span className="text-white text-3xl font-black">
                    {plan.price}
                  </span>
                  <span className="text-text-secondary text-sm font-medium">
                    /total
                  </span>
                </div>

                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-text-secondary text-sm"
                    >
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.features.length === 0 && (
                  <p className="flex-1 text-text-secondary/50 text-sm italic">
                    Nenhum benefício listado.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.hiddenGlobal && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded">
                      Oculto Globalmente
                    </span>
                  )}
                  {plan.displayOnLandingPage === false && !plan.hiddenGlobal && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 text-text-secondary border border-divider-dark rounded">
                      Oculto na Landing Page
                    </span>
                  )}
                  {plan.showPriceOnLandingPage === false && plan.displayOnLandingPage !== false && !plan.hiddenGlobal && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 text-text-secondary border border-divider-dark rounded">
                      Valor Oculto na L.P.
                    </span>
                  )}
                  {plan.allowHiddenRenewal && plan.hiddenGlobal && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded">
                      Renovação Permitida
                    </span>
                  )}
                </div>
              </div>
            ))}

            {plans.length === 0 && (
              <div className="col-span-1 border-2 border-dashed border-divider-dark rounded-2xl flex flex-col items-center justify-center py-16 text-center px-4">
                <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">
                  loyalty
                </span>
                <p className="text-white font-bold">Nenhum plano cadastrado</p>
                <p className="text-text-secondary text-sm mt-1">
                  Crie seu primeiro plano para exibi-lo aos alunos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerPlans;
