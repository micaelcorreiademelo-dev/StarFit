import React, { useState, useEffect, useRef } from "react";
import PublicLandingPage, {
  LandingPageData,
  defaultLandingPageData,
  SectionConfig,
} from "./PublicLandingPage";
import { trainerService } from "../services/trainerService";
import { HexColorPicker } from "react-colorful";
import { Settings, Image as ImageIcon, Type, Share2, Eye, LayoutList, Check, Trash2, GripVertical, Plus } from "lucide-react";

// Reusable Color Picker Component
const ColorPickerField = ({ label, color, onChange }: { label: string, color: string, onChange: (color: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popover.current && !popover.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const isTransparent = color === "transparent" || color === "";

  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-xs font-bold text-text-secondary">{label}</label>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg border border-border-dark cursor-pointer overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZCASMDKgwn///z+oZ2BggDFQA0kOjWZQNAwYA0lgmBhU82iIYYg2AAEAoxsVf2RjJ0cAAAAASUVORK5CYII=')]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-full h-full" style={{ backgroundColor: isTransparent ? 'transparent' : color }} />
        </div>
        <div className="flex-1 bg-background-dark border border-border-dark rounded-lg px-3 py-2 flex items-center">
           <input 
              type="text" 
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="bg-transparent text-white text-sm outline-none w-full font-mono"
              placeholder="transparent ou #HEX"
           />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute top-16 left-0 z-50 bg-[#182c1e] p-4 rounded-xl border border-border-dark shadow-2xl" ref={popover}>
           <HexColorPicker color={isTransparent ? "#102216" : color} onChange={onChange} />
           <button 
             className="w-full mt-4 text-xs font-bold text-text-secondary hover:text-white transition-colors"
             onClick={() => { onChange("transparent"); setIsOpen(false); }}
           >
             Definir como Transparente
           </button>
        </div>
      )}
    </div>
  );
};

import { ImageUpload } from "../components/ImageUpload";
import { User } from "../types";

const TrainerLandingPage: React.FC<{ user: User }> = ({ user }) => {
  const [editorTab, setEditorTab] = useState<
    "visual" | "imagens" | "textos" | "secoes" | "social"
  >("visual");
  const [trainerURL, setTrainerURL] = useState(user.username?.replace('@', '') || "");
  
  const [data, setData] = useState<LandingPageData>(defaultLandingPageData);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    if (user.username) {
      setLoading(true);
      const fetchedData = await trainerService.getTrainerData(user.username.replace('@', ''));
      
      // Safety check to ensure any new sections added to defaultLandingPageData exist in the fetched state
      const mergedSections = { ...defaultLandingPageData.sections, ...(fetchedData.sections || {}) };
      for (const key of Object.keys(defaultLandingPageData.sections)) {
         if (!mergedSections[key as keyof LandingPageData['sections']]) {
            mergedSections[key as keyof LandingPageData['sections']] = defaultLandingPageData.sections[key as keyof LandingPageData['sections']];
         }
      }
      fetchedData.sections = mergedSections;
      
      setData(fetchedData);
      setTrainerURL(user.username.replace('@', ''));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user.username]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.username === user.username?.replace('@', '')) {
        setData(prev => {
           const newData = { ...prev, ...e.detail.data };
           const mergedSections = { ...defaultLandingPageData.sections, ...(newData.sections || {}) };
           for (const key of Object.keys(defaultLandingPageData.sections)) {
             if (!mergedSections[key as keyof LandingPageData['sections']]) {
                mergedSections[key as keyof LandingPageData['sections']] = defaultLandingPageData.sections[key as keyof LandingPageData['sections']];
             }
           }
           newData.sections = mergedSections;
           return newData;
        });
      }
    };
    window.addEventListener("trainer_data_updated", handleUpdate);
    return () => window.removeEventListener("trainer_data_updated", handleUpdate);
  }, [user.username]);

  const [saved, setSaved] = useState(false);

  const originUrl = window.location.origin + window.location.pathname;
  const fullUrl = `${originUrl}#/@${trainerURL}`;

  const copyURL = () => {
    navigator.clipboard.writeText(fullUrl);
    alert("Link copiado!");
  };

  const handleSave = async () => {
    if (user.username) {
      await trainerService.saveTrainerData(user.username.replace('@', ''), {
        ...data,
        trainerId: user.id
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-medium italic">Carregando Editor...</p>
        </div>
      </div>
    );
  }

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

  const updateSectionConfig = (sectionId: keyof LandingPageData['sections'], field: keyof SectionConfig, value: any) => {
    setData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          [field]: value
        }
      }
    }));
  };

  const moveSection = (sectionId: keyof LandingPageData['sections'], direction: 'up' | 'down') => {
    const sectionsObj = data.sections;
    const sortedIds = (Object.keys(sectionsObj) as (keyof LandingPageData['sections'])[])
      .sort((a, b) => sectionsObj[a].order - sectionsObj[b].order);
    
    const currentIndex = sortedIds.indexOf(sectionId);
    if (direction === 'up' && currentIndex > 0) {
      const targetId = sortedIds[currentIndex - 1];
      const newSections = { ...sectionsObj };
      const tempOrder = newSections[sectionId].order;
      newSections[sectionId].order = newSections[targetId].order;
      newSections[targetId].order = tempOrder;
      setData(prev => ({ ...prev, sections: newSections }));
    } else if (direction === 'down' && currentIndex < sortedIds.length - 1) {
      const targetId = sortedIds[currentIndex + 1];
      const newSections = { ...sectionsObj };
      const tempOrder = newSections[sectionId].order;
      newSections[sectionId].order = newSections[targetId].order;
      newSections[targetId].order = tempOrder;
      setData(prev => ({ ...prev, sections: newSections }));
    }
  };

  const sectionLabels: Record<keyof LandingPageData['sections'], string> = {
    about: "Sobre Mim",
    services: "Serviços Oferecidos",
    testimonials: "O Que Meus Alunos Dizem",
    gallery: "Galeria de Resultados",
    plans: "Escolha seu Plano",
    contact: "Fale Comigo"
  };

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-6">
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
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
              <button
                onClick={() => window.open(fullUrl, "_blank")}
                className="text-primary hover:text-white transition-colors p-2"
                title="Visualizar Landing Page"
              >
                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor Tabs Nav */}
        <div className="flex justify-center border-b border-border-dark overflow-x-auto overflow-y-hidden pb-1 no-scrollbar shrink-0">
          {[
            { id: "visual", label: "Visual", icon: <Settings size={16}/> },
            { id: "secoes", label: "Seções", icon: <LayoutList size={16}/> },
            { id: "textos", label: "Textos", icon: <Type size={16}/> },
            { id: "imagens", label: "Imagens", icon: <ImageIcon size={16}/> },
            { id: "social", label: "Redes", icon: <Share2 size={16}/> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEditorTab(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 pb-3 text-sm font-bold transition-all ${editorTab === tab.id ? "text-primary border-b-2 border-primary" : "text-text-secondary hover:text-white"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Editor Forms */}
        <div className="flex flex-col gap-5 pb-8 flex-1">
          {editorTab === "visual" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <h3 className="text-white font-bold tracking-tight">Cores Globais</h3>
              <ColorPickerField 
                label="Cor Principal (Destaques e Botões)" 
                color={data.theme.primaryColor} 
                onChange={(c) => updateData("theme", "primaryColor", c)} 
              />
              <ColorPickerField 
                label="Cor de Fundo da Landing Page" 
                color={data.theme.backgroundColor} 
                onChange={(c) => updateData("theme", "backgroundColor", c)} 
              />
              <ColorPickerField 
                label="Cor dos Textos Globais" 
                color={data.theme.textColor} 
                onChange={(c) => updateData("theme", "textColor", c)} 
              />
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-text-secondary">
                  Estilo dos Botões e Cards
                </label>
                <select
                  value={data.theme.buttonStyle}
                  onChange={(e) => {
                     updateData("theme", "buttonStyle", e.target.value);
                     // Sincronizando button e card style por simplicidade ou manter separado
                     updateData("theme", "cardStyle", e.target.value === 'rounded-full' ? 'rounded-2xl' : e.target.value);
                  }}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                >
                  <option value="rounded-none">Quadrado</option>
                  <option value="rounded-md">Arredondado Leve</option>
                  <option value="rounded-xl">Arredondado Médio</option>
                  <option value="rounded-full">Arredondado Total</option>
                </select>
              </div>

              <div className="h-px bg-border-dark my-2 w-full"></div>

              <h3 className="text-white font-bold tracking-tight">Cores das Seções</h3>
              <p className="text-xs text-text-secondary -mt-4">Defina "transparent" para usar a Cor de Fundo Global.</p>
              
              {(Object.keys(data.sections) as (keyof LandingPageData['sections'])[]).map((sectionKey) => (
                 <ColorPickerField 
                  key={sectionKey}
                  label={`Fundo: ${sectionLabels[sectionKey]}`} 
                  color={data.sections[sectionKey].backgroundColor} 
                  onChange={(c) => updateSectionConfig(sectionKey, "backgroundColor", c)} 
                />
              ))}

            </div>
          )}

          {editorTab === "secoes" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
               <p className="text-xs text-text-secondary mb-2">Reorganize ou oculte seções da sua Landing Page.</p>
               
               {(Object.keys(data.sections) as (keyof LandingPageData['sections'])[])
                 .sort((a,b) => data.sections[a].order - data.sections[b].order)
                 .map((sectionKey, index, array) => (
                  <div key={sectionKey} className="flex items-center gap-3 bg-background-dark border border-border-dark p-3 rounded-xl shadow-sm">
                     <div className="flex flex-col gap-1">
                        <button 
                          disabled={index === 0}
                          onClick={() => moveSection(sectionKey, 'up')}
                          className="text-text-secondary hover:text-white disabled:opacity-30 disabled:hover:text-text-secondary"
                        >
                           <span className="material-symbols-outlined text-[16px]">expand_less</span>
                        </button>
                        <button 
                          disabled={index === array.length - 1}
                          onClick={() => moveSection(sectionKey, 'down')}
                          className="text-text-secondary hover:text-white disabled:opacity-30 disabled:hover:text-text-secondary"
                        >
                           <span className="material-symbols-outlined text-[16px]">expand_more</span>
                        </button>
                     </div>
                     <span className="text-sm font-bold text-white flex-1">{sectionLabels[sectionKey]}</span>
                     
                     <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                           type="checkbox" 
                           className="sr-only peer"
                           checked={data.sections[sectionKey].visible}
                           onChange={(e) => updateSectionConfig(sectionKey, "visible", e.target.checked)}
                        />
                        <div className="relative shrink-0 w-11 h-6 bg-[#182c1e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                     </label>
                  </div>
               ))}
            </div>
          )}

          {editorTab === "textos" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Seu Nome / Título Hero</label>
                <input
                  type="text"
                  value={data.hero.name}
                  onChange={(e) => updateData("hero", "name", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Slogan Principal</label>
                <input
                  type="text"
                  value={data.hero.slogan}
                  onChange={(e) => updateData("hero", "slogan", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Sub Slogan</label>
                <textarea
                  rows={2}
                  value={data.hero.subSlogan}
                  onChange={(e) => updateData("hero", "subSlogan", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-text-secondary">Texto do Botão Principal (Hero)</label>
                 <input
                  type="text"
                  value={data.hero.ctaText}
                  onChange={(e) => updateData("hero", "ctaText", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="h-px bg-border-dark my-2 w-full"></div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Título da Seção "Sobre Mim"</label>
                <input
                  type="text"
                  value={data.about.title}
                  onChange={(e) => updateData("about", "title", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Seu CREF</label>
                <input
                  type="text"
                  value={data.about.cref}
                  onChange={(e) => updateData("about", "cref", e.target.value)}
                  placeholder="Ex: CREF 000000-G/SP"
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Biografia (Sobre Mim)</label>
                <textarea
                  rows={4}
                  value={data.about.description}
                  onChange={(e) => updateData("about", "description", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary resize-none"
                ></textarea>
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-text-secondary">Texto do Botão WhatsApp (Nav)</label>
                 <input
                  type="text"
                  value={data.hero.whatsappText || ""}
                  onChange={(e) => updateData("hero", "whatsappText", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="h-px bg-border-dark my-2 w-full"></div>
              
              <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-white">Serviços Oferecidos</label>
                    <button 
                      onClick={() => {
                         const newServices = [...data.services];
                         newServices.push({ id: Date.now(), icon: "fitness_center", title: "Novo Serviço", description: "Descrição" });
                         setData(prev => ({ ...prev, services: newServices }));
                      }}
                      className="text-primary hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                    >
                       <Plus size={14}/> Adicionar Serviço
                    </button>
                 </div>
                 {data.services.map((service, i) => (
                    <div key={service.id} className="flex flex-col gap-2 bg-background-dark p-3 rounded-xl border border-border-dark">
                       <div className="flex items-center justify-between gap-2">
                         <input 
                           type="text"
                           value={service.icon || ""}
                           onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[i].icon = e.target.value;
                              setData(prev => ({ ...prev, services: newServices }));
                           }}
                           className="text-xs text-primary bg-transparent outline-none border-b border-border-dark focus:border-primary w-20 shrink-0"
                           placeholder="Icon (ex: star)"
                         />
                         <input 
                           type="text"
                           value={service.title}
                           onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[i].title = e.target.value;
                              setData(prev => ({ ...prev, services: newServices }));
                           }}
                           className="font-bold text-sm bg-transparent text-white outline-none border-b border-border-dark focus:border-primary flex-1"
                           placeholder="Ex: Consultoria"
                         />
                         <button
                           onClick={() => {
                              setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== service.id) }));
                           }}
                           className="text-red-400 hover:text-red-300 ml-2"
                         >
                            <Trash2 size={14}/>
                         </button>
                       </div>
                       <textarea 
                         value={service.description}
                         onChange={(e) => {
                            const newServices = [...data.services];
                            newServices[i].description = e.target.value;
                            setData(prev => ({ ...prev, services: newServices }));
                         }}
                         className="text-xs text-text-secondary bg-transparent resize-none outline-none mt-1"
                         rows={2}
                         placeholder="Descrição do serviço..."
                       />
                    </div>
                 ))}
                 {data.services.length === 0 && <p className="text-xs text-text-secondary">Nenhum serviço cadastrado.</p>}
              </div>

              <div className="h-px bg-border-dark my-2 w-full"></div>
              
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-text-secondary">Título "Galeria de Resultados"</label>
                 <input
                   type="text"
                   value={data.results?.title || ""}
                   onChange={(e) => updateData("results", "title", e.target.value)}
                   className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary w-full"
                 />
              </div>

              <div className="h-px bg-border-dark my-2 w-full"></div>
              
              <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-white">Depoimentos</label>
                    <button 
                      onClick={() => {
                         const newTestimonials = { ...data.testimonials };
                         newTestimonials.items.push({ id: Date.now(), name: "Novo Aluno", role: "Aluno", text: "Excelente profissional!", image: "https://via.placeholder.com/100?text=Foto" });
                         updateData("testimonials", "items", newTestimonials.items);
                      }}
                      className="text-primary hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                    >
                       <Plus size={14}/> Adicionar Depoimento
                    </button>
                 </div>
                 <div className="flex flex-col gap-2 mb-2">
                    <label className="text-xs font-bold text-text-secondary">Título da Seção de Depoimentos</label>
                    <input
                      type="text"
                      value={data.testimonials?.title || ""}
                      onChange={(e) => updateData("testimonials", "title", e.target.value)}
                      placeholder="Título..."
                      className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary w-full"
                    />
                 </div>
                 {data.testimonials.items.map((testimonial, i) => (
                    <div key={testimonial.id} className="flex flex-col gap-2 bg-background-dark p-3 rounded-xl border border-border-dark">
                       <div className="flex items-center justify-between gap-2">
                         <img src={testimonial.image} className="w-8 h-8 rounded-full object-cover shrink-0" />
                         <input 
                           type="text"
                           value={testimonial.name}
                           onChange={(e) => {
                              const newTestimonials = { ...data.testimonials };
                              newTestimonials.items[i].name = e.target.value;
                              updateData("testimonials", "items", newTestimonials.items);
                           }}
                           className="font-bold text-sm bg-transparent text-white outline-none border-b border-border-dark focus:border-primary flex-1 min-w-0"
                           placeholder="Nome..."
                         />
                         <button
                           onClick={() => {
                              const newTestimonials = { ...data.testimonials };
                              newTestimonials.items = newTestimonials.items.filter(t => t.id !== testimonial.id);
                              updateData("testimonials", "items", newTestimonials.items);
                           }}
                           className="text-red-400 hover:text-red-300 ml-2 shrink-0"
                         >
                            <Trash2 size={14}/>
                         </button>
                       </div>
                       <input 
                           type="text"
                           value={testimonial.role || ""}
                           onChange={(e) => {
                              const newTestimonials = { ...data.testimonials };
                              newTestimonials.items[i].role = e.target.value;
                              updateData("testimonials", "items", newTestimonials.items);
                           }}
                           className="text-xs text-primary bg-transparent outline-none mt-1"
                           placeholder="Ex: Aluno Presencial"
                       />
                       <div className="mt-2">
                         <ImageUpload
                           currentImageUrl={testimonial.image}
                           onUploadSuccess={(url) => {
                              const newTestimonials = { ...data.testimonials };
                              newTestimonials.items[i].image = url;
                              updateData("testimonials", "items", newTestimonials.items);
                           }}
                           folder={`landing_pages/${user.id}/testimonials`}
                           maxSizeMB={0.5}
                           maxWidthOrHeight={300}
                           idealText="Ideal: quadrada, máx: 500KB"
                           label="Foto do Aluno"
                         />
                       </div>
                       <textarea 
                         value={testimonial.text || ""}
                         onChange={(e) => {
                            const newTestimonials = { ...data.testimonials };
                            newTestimonials.items[i].text = e.target.value;
                            updateData("testimonials", "items", newTestimonials.items);
                         }}
                         className="text-xs text-text-secondary bg-transparent resize-none outline-none mt-1 border-t border-border-dark pt-2"
                         rows={2}
                         placeholder="Deixe uma mensagem..."
                       />
                    </div>
                 ))}
                 {data.testimonials.items.length === 0 && <p className="text-xs text-text-secondary">Nenhum depoimento cadastrado.</p>}
              </div>

               <div className="h-px bg-border-dark my-2 w-full"></div>
               
               <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-white">Contato ("Fale Comigo")</label>
                 <input
                   type="text"
                   value={data.contact?.title || ""}
                   onChange={(e) => updateData("contact", "title", e.target.value)}
                   placeholder="Título (ex: Fale Comigo)"
                   className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                 />
                 <textarea
                   rows={2}
                   value={data.contact?.description || ""}
                   onChange={(e) => updateData("contact", "description", e.target.value)}
                   placeholder="Descrição do contato"
                   className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary resize-none mt-1"
                 ></textarea>
               </div>

            </div>
          )}

          {editorTab === "imagens" && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              <ImageUpload 
                currentImageUrl={data.hero.profileImage}
                onUploadSuccess={(url) => updateData("hero", "profileImage", url)}
                folder={`landing_pages/${user.id}/profile`}
                maxSizeMB={1}
                maxWidthOrHeight={500}
                idealText="Resolução ideal: 500x500px. Máximo: 1MB"
                label="Foto de Perfil"
              />

              <ImageUpload 
                currentImageUrl={data.hero.bannerImage}
                onUploadSuccess={(url) => updateData("hero", "bannerImage", url)}
                folder={`landing_pages/${user.id}/banner`}
                maxSizeMB={2}
                maxWidthOrHeight={1920}
                idealText="Resolução ideal: 1920x800px. Máximo: 2MB"
                label="Banner Principal (Capa)"
              />

              <div className="h-px bg-border-dark my-4 w-full"></div>
              
              <div className="flex flex-col gap-4">
                 <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-bold text-white">Galeria de Resultados</label>
                      <p className="text-xs text-text-secondary">Envie fotos de antes/depois ou resultados dos alunos.</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {data.results.items.map((res, i) => (
                      <div key={res.id} className="relative group rounded-xl overflow-hidden border border-border-dark bg-background-dark/50">
                         <ImageUpload
                           currentImageUrl={res.image}
                           onUploadSuccess={(url) => {
                              const newResults = { ...data.results };
                              newResults.items[i].image = url;
                              updateData("results", "items", newResults.items);
                           }}
                           folder={`landing_pages/${user.id}/gallery`}
                           maxSizeMB={1.5}
                           maxWidthOrHeight={1200}
                           idealText="Ideal: 1200x1200px (Máx: 1.5MB)"
                           label={`Imagem ${i + 1}`}
                         />
                         <button
                           onClick={() => {
                              const newResults = { ...data.results };
                              newResults.items = newResults.items.filter(item => item.id !== res.id);
                              updateData("results", "items", newResults.items);
                           }}
                           className="absolute top-2 right-2 p-2 bg-red-500/80 text-white hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20"
                           title="Remover Imagem"
                         >
                            <Trash2 size={16}/>
                         </button>
                      </div>
                   ))}

                   <div 
                     onClick={() => {
                        const newResults = { ...data.results };
                        newResults.items.push({ id: Date.now(), image: "" });
                        updateData("results", "items", newResults.items);
                     }}
                     className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-dark hover:border-primary hover:bg-primary/5 rounded-xl cursor-pointer transition-colors"
                   >
                      <div className="size-12 rounded-full bg-border-dark flex items-center justify-center mb-3">
                         <span className="material-symbols-outlined text-text-secondary">add_circle</span>
                      </div>
                      <span className="text-sm font-bold text-white">Adicionar Foto</span>
                   </div>
                 </div>
                 
              </div>
            </div>
          )}

          {editorTab === "social" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Insta" className="w-4 h-4 grayscale"/> Instagram URL
                </label>
                <input
                  type="text"
                  value={data.social.instagram}
                  onChange={(e) => updateData("social", "instagram", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="Whats" className="w-4 h-4 grayscale"/> WhatsApp (URL wa.me)
                </label>
                <input
                  type="text"
                  value={data.social.whatsapp}
                  onChange={(e) => updateData("social", "whatsapp", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">facebook</span> Facebook URL
                </label>
                <input
                  type="text"
                  value={data.social.facebook || ""}
                  onChange={(e) => updateData("social", "facebook", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">smart_display</span> Youtube URL
                </label>
                <input
                  type="text"
                  value={data.social.youtube || ""}
                  onChange={(e) => updateData("social", "youtube", e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>
        </div>

        <div className="mt-4 pb-8">
          {saved && (
            <p className="text-primary text-xs font-bold text-center mb-2 animate-pulse flex items-center justify-center gap-1">
              <Check size={14}/> Alterações salvas!
            </p>
          )}
          <button
            onClick={handleSave}
            className="h-12 w-full bg-primary text-background-dark rounded-lg font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            Publicar Alterações
          </button>
        </div>
    </div>
  );
};

export default TrainerLandingPage;
