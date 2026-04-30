import React, { useState } from "react";
import PublicLandingPage, {
  LandingPageData,
  defaultLandingPageData,
} from "./PublicLandingPage";

const TrainerLandingPage: React.FC = () => {
  const [editorTab, setEditorTab] = useState<
    "visual" | "imagens" | "textos" | "planos" | "social"
  >("visual");
  const [trainerURL, setTrainerURL] = useState("flaylima"); // Just username
  const [data, setData] = useState<LandingPageData>(defaultLandingPageData);
  const [saved, setSaved] = useState(false);

  const originUrl = window.location.origin + window.location.pathname;
  const fullUrl = `${originUrl}#/@${trainerURL}`;

  const copyURL = () => {
    navigator.clipboard.writeText(fullUrl);
    alert("Link copiado!");
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateData = (
    section: keyof LandingPageData,
    field: string,
    value: any,
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  return (
    <div className="flex flex-col xl:flex-row h-full gap-6 pb-20">
      {/* Editor Sidebar */}
      <aside className="w-full xl:w-[450px] shrink-0 flex flex-col gap-6 bg-card-dark border border-border-dark rounded-2xl p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Configuração da Landing Page
          </h1>
          <p className="text-text-secondary text-sm">
            Personalize sua página pública de captação de alunos.
          </p>
        </div>

        {/* Link & QR Code */}
        <div className="bg-background-dark p-4 rounded-xl border border-border-dark flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Sua URL Pública</p>
              <p className="text-xs text-text-secondary">{fullUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyURL}
                className="text-primary hover:text-white transition-colors p-2"
                title="Copiar Link"
              >
                <span className="material-symbols-outlined">content_copy</span>
              </button>
              <button
                onClick={() => window.open(fullUrl, "_blank")}
                className="text-primary hover:text-white transition-colors p-2"
                title="Visualizar Landing Page"
              >
                <span className="material-symbols-outlined">open_in_new</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-border-dark pt-4">
            <div className="bg-white p-2 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}`}
                alt="QR Code"
                className="w-16 h-16"
              />
            </div>
            <button className="flex-1 bg-primary text-background-dark h-10 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">download</span> QR
              Code
            </button>
          </div>
        </div>

        {/* Editor Tabs Nav - Scrollable horizontally if needed */}
        <div className="flex border-b border-border-dark overflow-x-auto overflow-y-hidden pb-1 no-scrollbar">
          {[
            { id: "visual", label: "Visual" },
            { id: "imagens", label: "Imagens" },
            { id: "textos", label: "Textos" },
            { id: "planos", label: "Planos" },
            { id: "social", label: "Redes Sociais" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEditorTab(tab.id as any)}
              className={`whitespace-nowrap px-4 pb-3 text-sm font-bold transition-all ${editorTab === tab.id ? "text-primary border-b-2 border-primary" : "text-text-secondary hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editor Forms */}
        <div className="flex flex-col gap-5 pb-8">
          {editorTab === "visual" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Cor Principal
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={data.theme.primaryColor}
                    onChange={(e) =>
                      updateData("theme", "primaryColor", e.target.value)
                    }
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-sm font-mono text-gray-400">
                    {data.theme.primaryColor}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Cor de Fundo
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={data.theme.backgroundColor}
                    onChange={(e) =>
                      updateData("theme", "backgroundColor", e.target.value)
                    }
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-sm font-mono text-gray-400">
                    {data.theme.backgroundColor}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="text-xs font-bold text-text-secondary">
                  Estilo dos Botões
                </label>
                <select
                  value={data.theme.buttonStyle}
                  onChange={(e) =>
                    updateData("theme", "buttonStyle", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="rounded-none">Quadrado</option>
                  <option value="rounded-md">Arredondado Leve</option>
                  <option value="rounded-xl">Arredondado Médio</option>
                  <option value="rounded-full">Arredondado Total</option>
                </select>
              </div>
            </div>
          )}

          {editorTab === "imagens" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  URL da Foto de Perfil
                </label>
                <div className="flex gap-4 items-center">
                  <img
                    src={data.hero.profileImage}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border border-border-dark object-cover"
                  />
                  <input
                    type="text"
                    value={data.hero.profileImage}
                    onChange={(e) =>
                      updateData("hero", "profileImage", e.target.value)
                    }
                    className="flex-1 bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  URL do Banner Principal (Capa)
                </label>
                <div className="flex gap-4 items-center">
                  <img
                    src={data.hero.bannerImage}
                    alt="Banner"
                    className="w-24 h-16 rounded-lg border border-border-dark object-cover"
                  />
                  <input
                    type="text"
                    value={data.hero.bannerImage}
                    onChange={(e) =>
                      updateData("hero", "bannerImage", e.target.value)
                    }
                    className="flex-1 bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {editorTab === "textos" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={data.hero.name}
                  onChange={(e) => updateData("hero", "name", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Especialidade (Ex: Hipertrofia)
                </label>
                <input
                  type="text"
                  value={data.hero.specialty}
                  onChange={(e) =>
                    updateData("hero", "specialty", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Slogan Principal
                </label>
                <input
                  type="text"
                  value={data.hero.slogan}
                  onChange={(e) => updateData("hero", "slogan", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="block h-px w-full bg-border-dark my-2"></div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Sobre Mim (Biografia)
                </label>
                <textarea
                  rows={4}
                  value={data.about.description}
                  onChange={(e) =>
                    updateData("about", "description", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm resize-none"
                ></textarea>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">
                  Texto do Botão CTA
                </label>
                <input
                  type="text"
                  value={data.hero.ctaText}
                  onChange={(e) =>
                    updateData("hero", "ctaText", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          )}

          {editorTab === "planos" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              {data.plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="bg-background-dark border border-border-dark p-4 rounded-lg flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => {
                        const newPlans = [...data.plans];
                        newPlans[index].name = e.target.value;
                        setData({ ...data, plans: newPlans });
                      }}
                      className="font-bold text-white bg-transparent border-b border-border-dark focus:border-primary outline-none"
                    />
                    <button
                      onClick={() => {
                        const newPlans = data.plans.filter(
                          (_, i) => i !== index,
                        );
                        setData({ ...data, plans: newPlans });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={plan.price}
                    onChange={(e) => {
                      const newPlans = [...data.plans];
                      newPlans[index].price = e.target.value;
                      setData({ ...data, plans: newPlans });
                    }}
                    className="text-primary font-bold bg-transparent border-b border-border-dark outline-none py-1"
                  />
                  <textarea
                    rows={2}
                    value={plan.description}
                    onChange={(e) => {
                      const newPlans = [...data.plans];
                      newPlans[index].description = e.target.value;
                      setData({ ...data, plans: newPlans });
                    }}
                    className="text-xs text-gray-400 bg-transparent border border-border-dark rounded p-2 outline-none resize-none"
                  ></textarea>
                </div>
              ))}
              <button
                onClick={() => {
                  const newPlan = {
                    id: Date.now(),
                    name: "Novo Plano",
                    price: "R$ 00,00",
                    description: "Descrição...",
                    features: ["Benefício 1", "Benefício 2"],
                  };
                  setData({ ...data, plans: [...data.plans, newPlan] });
                }}
                className="flex items-center justify-center gap-2 h-10 border border-dashed border-border-dark rounded-lg text-sm font-bold text-text-secondary hover:text-white hover:border-text-secondary transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>{" "}
                Adicionar Plano
              </button>
            </div>
          )}

          {editorTab === "social" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
                    alt="Insta"
                    className="w-4 h-4 grayscale"
                  />{" "}
                  Instagram URL
                </label>
                <input
                  type="text"
                  value={data.social.instagram}
                  onChange={(e) =>
                    updateData("social", "instagram", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/733/733585.png"
                    alt="Whats"
                    className="w-4 h-4 grayscale"
                  />{" "}
                  WhatsApp (Ex: https://wa.me/55...)
                </label>
                <input
                  type="text"
                  value={data.social.whatsapp}
                  onChange={(e) =>
                    updateData("social", "whatsapp", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
                    alt="YouTube"
                    className="w-4 h-4 grayscale"
                  />{" "}
                  YouTube URL
                </label>
                <input
                  type="text"
                  value={data.social.youtube}
                  onChange={(e) =>
                    updateData("social", "youtube", e.target.value)
                  }
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto">
          {saved && (
            <p className="text-primary text-xs font-bold text-center mb-2 animate-pulse">
              Alterações salvas com sucesso!
            </p>
          )}
          <button
            onClick={handleSave}
            className="h-12 w-full bg-primary text-background-dark rounded-lg font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            Salvar Alterações
          </button>
        </div>
      </aside>

      {/* Live Preview Pane */}
      <section className="flex-1 bg-black/50 rounded-2xl border border-border-dark p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-120px)] relative custom-scrollbar flex justify-center w-full">
        <div className="absolute top-4 left-6 hidden md:block z-10 bg-background-dark/80 px-3 py-1 rounded-full border border-border-dark backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">
              visibility
            </span>{" "}
            Preview em Tempo Real
          </span>
        </div>

        {/* We place the full public landing page directly here and scale it. It will use the exact data. */}
        <div className="w-full max-w-[1200px] mx-auto origin-top transition-transform h-[800px] border-4 border-border-dark rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pb-[200px]">
            <PublicLandingPage previewData={data} />
          </div>
          {/* Add a fade out bottom to indicate scrollable content */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-dark to-transparent pointer-events-none"></div>
        </div>
      </section>
    </div>
  );
};

export default TrainerLandingPage;
