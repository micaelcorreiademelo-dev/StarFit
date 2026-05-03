import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { trainerService } from "../services/trainerService";
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export interface SectionConfig {
  visible: boolean;
  order: number;
  backgroundColor: string;
}

// ... unchanged parts
export interface LandingPageData {
  username: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonStyle: string;
    cardStyle: string;
  };
  sections: {
    about: SectionConfig;
    services: SectionConfig;
    testimonials: SectionConfig;
    gallery: SectionConfig;
    contact: SectionConfig;
  };
  hero: {
    name: string;
    specialty: string;
    slogan: string;
    subSlogan: string;
    ctaText: string;
    whatsappText: string;
    bannerImage: string;
    profileImage: string;
  };
  about: {
    title: string;
    description: string;
    experience: string;
    methodology: string;
    specialties: string[];
    cref: string;
  };
  services: {
    id: number;
    icon: string;
    title: string;
    description: string;
  }[];
  plans: {
    id: number;
    name: string;
    price: string;
    durationDays: number;
    description: string;
    features: string[];
    isPopular?: boolean;
  }[];
  results: {
    title: string;
    items: { id: number; image: string }[];
  };
  testimonials: {
    title: string;
    items: {
      id: number;
      name: string;
      role: string;
      text: string;
      image: string;
    }[];
  };
  contact: {
    title: string;
    description: string;
  };
  social: {
    instagram: string;
    whatsapp: string;
    youtube: string;
    facebook: string;
  };
}

export const defaultLandingPageData: LandingPageData = {
  username: "alexlima",
  theme: {
    primaryColor: "#13ec5b",
    secondaryColor: "#1A1A1A",
    backgroundColor: "#102216",
    textColor: "#e0f5e7",
    buttonStyle: "rounded-lg",
    cardStyle: "rounded-xl",
  },
  sections: {
    about: { visible: true, order: 1, backgroundColor: "transparent" },
    services: { visible: true, order: 2, backgroundColor: "transparent" },
    testimonials: { visible: true, order: 3, backgroundColor: "transparent" },
    gallery: { visible: true, order: 4, backgroundColor: "transparent" },
    contact: { visible: true, order: 5, backgroundColor: "transparent" },
  },
  hero: {
    name: "Alex Lima",
    specialty: "Personal Trainer",
    slogan: "Transforme seu Corpo e sua Vida",
    subSlogan:
      "Alcance seus objetivos com um acompanhamento personalizado e profissional. Chega de desculpas, vamos treinar!",
    ctaText: "Comece Agora",
    whatsappText: "Agende sua Aula",
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBodf_pr2A6i_44X5MQ2OAS514niIBbWvaKzdmvLRow5mlXrXvtN5ylA323mT6NTj32jSzOOiXJdNUTAsNVl8QLYp_DTr7ClLZQXBZtzmqCVSc0im-f9gcxF2noBOGCgcakE1fppbThCdYVwNhzwwx0F6zRXEvPh8h3_dXwwZPowZFdO40queYo_0OhGaybb3J1flsAVe3lQNHglTEVI-10TVmEpHkXVkko-lZ0HEuPM9VQ5WR41xBKEEDpzswZXeACrDtSNf_kAAg",
    profileImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3le6RtZuj7OTouysR-yPC2mk5Hv60BeO71uo8VCeJ0NQFwqu16M7FvAphw0ub_a-PmIyHrQ3Q3MQ5WolY4X8X7V3FSgR-844hEtY88MN7F0Vj0J9o7EQhdOoCaUOSvos6w18VWcsM48NMMrtjcAISQWvy3tqowRCOFfSiNR4nFc3AaEp2BIG1wS0U6vnqyE7Bgl870X5Ynq6TCPEAZ6_ANLxADwKiStEUQFsjq1GnMIgv_mtjvC_aw-ZZw1qqg0JF5WVOgz0rILo",
  },
  about: {
    title: "Sobre Mim",
    description:
      "Com mais de 10 anos de experiência, minha paixão é ajudar pessoas a descobrirem seu potencial máximo através do fitness. Minha filosofia é simples: treino inteligente, nutrição equilibrada e consistência.",
    experience: "10+ anos de experiência",
    methodology:
      "Treino inteligente e focado em resultados rápidos e sustentáveis.",
    specialties: ["Emagrecimento", "Hipertrofia", "Reabilitação"],
    cref: "CREF: 012345-G/SP",
  },
  services: [
    {
      id: 1,
      icon: "fitness_center",
      title: "Musculação",
      description:
        "Planos de treino focados em hipertrofia e ganho de força, adaptados para todos os níveis.",
    },
    {
      id: 2,
      icon: "directions_run",
      title: "Treinamento Funcional",
      description:
        "Melhore sua performance diária com treinos dinâmicos que trabalham o corpo de forma integrada.",
    },
    {
      id: 3,
      icon: "monitoring",
      title: "Consultoria Online",
      description:
        "Receba seu plano de treino e suporte completo à distância, para treinar onde e quando quiser.",
    },
  ],
  plans: [
    {
      id: 1,
      name: "Plano Bronze",
      price: "R$150",
      durationDays: 30,
      description: "",
      features: [
        "Consultoria Online",
        "Planilha de Treino Mensal",
        "Suporte via WhatsApp",
      ],
      isPopular: false,
    },
    {
      id: 2,
      name: "Plano Prata",
      price: "R$300",
      durationDays: 30,
      description: "",
      features: [
        "Acompanhamento Presencial 2x",
        "Planilha de Treino Individualizada",
        "Avaliação Física Trimestral",
        "Suporte Prioritário",
      ],
      isPopular: true,
    },
    {
      id: 3,
      name: "Plano Ouro",
      price: "R$500",
      durationDays: 30,
      description: "",
      features: [
        "Acompanhamento Presencial 4x",
        "Tudo do Plano Prata",
        "Ajustes de Treino em Tempo Real",
      ],
      isPopular: false,
    },
  ],
  results: {
    title: "Galeria de Resultados",
    items: [
      {
        id: 1,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDIdJNdHAqPS_Kt7JeQl-T14zFi_-Oe6T6K2jDJ0eWM-92dMKEC31yJxgq0lIA8DcQInks_nviQpe7OFG8AOoDhoQC6-gOrC8QoHGEfYzmJzorGLLVNjGpqvIeJ3saJUza6nACWoD3j2rl4cmF0yltEvz_6uNPxiljUdllZ5zeDUdK5S8zcINFS2QRGtL6yoYeFtHzmTRB8C9uWHxgI8Kdu5mtdyJmFM6sE6_2Cwq2Nhep78pcevKcb59FqTAh44EYKzyleJdi5CZM",
      },
      {
        id: 2,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCpfmXHSpJ2RsrVtJ7em4ac57VvOsZrjxqwJ9fetGG_VxWWeOScyy7bFzsESaAtaaNkV1JMjtkHPwsXPpPMsQBA2jO0w-IHHttuLp1lvS6wfsUAipmFlGzCS-GuWKCCIpu4FPb5v6nzwULgcj2eSwlnsRXc09d25OPzijQK71OFOjoR-6zGpSFq7OxPNfQhSv5nyZXQ7dfhjM-TBc-GFtMQUX9GGJu7L0HGq5eg3Cw_lUm5eoFhAgurXZ1QOQsfRu4AS4AUSXuj7nM",
      },
      {
        id: 3,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBqBq0M2r_EjlTznFt5EmUv7K5geVxundFIIIsC9XSM3QzB2rfcRbwvNreNKzyAxqMoIpZYD8iFzcLUt0zvUo1BH5DU0RMOHZVeUT6piH28ii3Ub6X6WW-8Bdt1kMVESaqTDlu7ru9NnUvyNtyGaNMt4O7jszRAP5RMfKZlCcgf-2JAUivoweZk7WrkczNZ20WO-fiZ2RSe3eBv7_Vjs6EFaVH08tw5DaoCOpSraeJ5lnjB5dVLjimM7i6eRiAJwX5ygxxdMeNzExE",
      },
      {
        id: 4,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAgfdNFwZ4ek6H4x59mIj_FKsb0YETZzZ3HkTfo7iDHzgWRmYSBmSQ-S4HfyBrZj623u4nYRL-D3-FMRAhLZ2d77Et7Bo24DQDYeT_8L_MsXAbsM2zaZYGFyNfAmq44c92FQyi3cyANfX1aDA0iyWHdXnDNLj4gR1giZxjdPluhqQndCiqlgBYevc5YLBp62VQJzerYjHUL-RRDr0h8NohU41TS5mJCk8lQKtSzqyq5IlE0cW9KsGFOKc7FENVCxay2-xcpHHGKXLo",
      },
    ],
  },
  testimonials: {
    title: "O que meus alunos dizem",
    items: [
      {
        id: 1,
        name: "Mariana Costa",
        role: "Aluna de Consultoria",
        text: "O melhor investimento que fiz na minha saúde! O Alex é um profissional incrível, sempre motivando e ajustando o treino para os meus objetivos. Já perdi 10kg em 3 meses!",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCG6oQIoFHifdFGhKdgQqypHWsfeaTEXQW66LeiGMrFO44sJHSspXzDxdGnXRun_gtAdDLB36hyUerCxJIeu5NoyyvXxNtdZjG7cw6P-9X6EaVQraLI6R2xYkYqTSJVO2rrMXI544tNCK_iFSk4Z0eVGvv-eAAlBGIIej2AyHhvmqNM5hmLX3DyDVS6VsFWukWn9OyhzEVF4vt6eUWyIr3241yTK8UFTFPo-pdAQR91-eWHb_a6swveFfNicxFuVVP0CfiSrH5rs8k",
      },
      {
        id: 2,
        name: "João Ferreira",
        role: "Aluno Presencial",
        text: "Finalmente consegui sair do sedentarismo. Os treinos são desafiadores, mas divertidos. A atenção que ele dá durante as aulas presenciais faz toda a diferença.",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBJ0spbGfhLmtjmHyxI_-wA8LS19vYzdZNMk3zRnSMTtxF9xJ1d8_V_X9jkqGgHQMwpDEW01GsD5hJQ3-qd3WlZGbOBeJ_ln1om1gwmu_-R-gyDfapsy3vBqyL7dcbPN8vPdQgYTTkShNwBiQE2gnzTPdulDNFdtNjbYl1V6QlYaxmcV1uTOJa48ETOpV432LcUjCzni97sxsyfBOIQDTOCpoIA2fZZAdHFz5TWW6yugbPvJGg1plByiZ72AMGq9mIDtlA66NMK6nA",
      },
    ],
  },
  contact: {
    title: "Fale Comigo",
    description: "Pronto para começar sua transformação? Entre em contato agora mesmo e vamos juntos alcançar os seus melhores resultados.",
  },
  social: {
    instagram: "https://instagram.com/",
    whatsapp: "https://wa.me/",
    youtube: "https://youtube.com/",
    facebook: "https://facebook.com/",
  },
};

const PublicLandingPage: React.FC<{ previewData?: LandingPageData }> = ({
  previewData,
}) => {
  const { username: urlUsername } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const renewingPlanName = searchParams.get('planToRenew');
  // Default to a specific username if none provided in URL
  const username = urlUsername || "carlossousa";
  const navigate = useNavigate();

  const [data, setData] = useState<LandingPageData>(previewData || defaultLandingPageData);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(!previewData);

  useEffect(() => {
    const fetchTrainerInfo = async () => {
       if (!username) return;
       const u = username.replace('@', '');
       const q = query(collection(db, 'users'), where('username', '==', '@' + u.toLowerCase()));
       try {
         const snap = await getDocs(q);
         if (!snap.empty) {
            setTrainerId(snap.docs[0].id);
         }
       } catch (err) {
         console.error("Error fetching trainer ID", err);
       }
    };
    fetchTrainerInfo();
  }, [username]);

  useEffect(() => {
    const loadData = async () => {
      if (!previewData && username) {
        setLoading(true);
        const fetchedData = await trainerService.getTrainerData(username.replace('@', ''));
        setData(fetchedData);
        setLoading(false);
      }
    };
    loadData();
  }, [username, previewData]);

  // Listen for real-time updates if in the same session
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.username === username.replace('@', '') && !previewData) {
        setData(e.detail.data);
      }
    };
    window.addEventListener("trainer_data_updated", handleUpdate);
    return () => window.removeEventListener("trainer_data_updated", handleUpdate);
  }, [username, previewData]);

  useEffect(() => {
    document.title = `${data.hero.name} - Personal Trainer`;
  }, [data.hero.name]);

  const handleRequestLink = async () => {
     if (!trainerId) return;
     if (!auth.currentUser) {
        // Redirect to register saving the trainer ref
        localStorage.setItem('pending_link_trainer_id', trainerId);
        localStorage.setItem('pending_link_trainer_name', data.hero.name);
        navigate('/register');
        return;
     }

     setRequestStatus('loading');
     try {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : { name: 'Usuário sem Nome' };

        // check if already requested
        const q = query(collection(db, 'linkRequests'), where('studentId', '==', uid), where('trainerId', '==', trainerId));
        const res = await getDocs(q);
        if (!res.empty) {
           setRequestStatus('success'); // already exists
           return;
        }

        await addDoc(collection(db, 'linkRequests'), {
          studentId: uid,
          studentName: userData.name || auth.currentUser.displayName || 'Novo Aluno',
          studentEmail: auth.currentUser.email,
          trainerId: trainerId,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        setRequestStatus('success');
     } catch (err) {
        console.error(err);
        setRequestStatus('error');
     }
  };

  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);

  const handleJoinPlan = async (plan: any) => {
    if (!trainerId) return;
    
    // 1. Fetch trainer's MP credentials
    const trainerDoc = await getDoc(doc(db, 'users', trainerId));
    if (!trainerDoc.exists()) return;
    const trainerData = trainerDoc.data();
    
    if (!trainerData.financialSettings?.mpAccessToken) {
      alert("Este personal ainda não configurou as chaves de pagamento do Mercado Pago.");
      return;
    }

    if (!auth.currentUser) {
      localStorage.setItem('pending_plan_checkout', JSON.stringify({ 
        trainerId, 
        planId: plan.id, 
        planName: plan.name, 
        price: plan.price.replace('R$', '').trim(),
        durationDays: plan.durationDays || 30
      }));
      navigate('/register');
      return;
    }

    setPaymentLoading(plan.id);
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerAccessToken: trainerData.financialSettings.mpAccessToken,
          studentEmail: auth.currentUser.email,
          planName: plan.name,
          price: plan.price.replace('R$', '').trim(),
          studentId: auth.currentUser.uid,
          trainerId: trainerId,
          metadata: {
            durationDays: plan.durationDays || 30
          }
        })
      });

      const result = await response.json();
      if (result.init_point) {
        window.location.href = result.init_point;
      } else {
        throw new Error(result.error || 'Erro ao gerar checkout');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao iniciar pagamento: ' + err.message);
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleConsultPlan = async (plan: any) => {
     if (!trainerId) return;
     if (!auth.currentUser) {
        localStorage.setItem('pending_link_trainer_id', trainerId);
        localStorage.setItem('pending_link_trainer_name', data.hero.name);
        localStorage.setItem('pending_consult_plan_message', `Consulta de Valor Landing Page (Plano: ${plan.name})`);
        navigate('/register');
        return;
     }

     setPaymentLoading(plan.id); 
     try {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : { name: 'Usuário sem Nome' };

        const q = query(collection(db, 'linkRequests'), where('studentId', '==', uid), where('trainerId', '==', trainerId));
        const res = await getDocs(q);
        
        if (res.empty) {
           await addDoc(collection(db, 'linkRequests'), {
             studentId: uid,
             studentName: userData.name || auth.currentUser.displayName || 'Novo Aluno',
             studentEmail: auth.currentUser.email,
             trainerId: trainerId,
             status: 'pending',
             observation: `Consulta de Valor Landing Page (Plano: ${plan.name})`,
             createdAt: serverTimestamp()
           });
        } else {
           // Se já existe e tá pending ou se já foi aceito, a gente só avisa o usuário
        }
        
        alert("Sua solicitação de consulta foi enviada! Após o personal aceitar seu vínculo, você poderá verificar os valores pelo sistema e entrar em contato pelo Chat.");
     } catch (err: any) {
        console.error(err);
        alert('Erro ao enviar solicitação: ' + err.message);
     } finally {
        setPaymentLoading(null);
     }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-medium italic">Carregando Landing Page...</p>
        </div>
      </div>
    );
  }

  const primaryStyle = {
    "--primary-color": data.theme.primaryColor,
  } as React.CSSProperties;

  return (
    <div
      className="absolute inset-0 flex w-full flex-col font-display custom-landing-page overflow-x-hidden overflow-y-auto custom-scrollbar"
      style={{
        ...primaryStyle,
        backgroundColor: data.theme.backgroundColor,
        color: data.theme.textColor,
      }}
    >
      <style>{`
        .custom-landing-page {
          --custom-primary: ${data.theme.primaryColor};
        }
        .bg-custom-primary { background-color: var(--custom-primary); }
        .text-custom-primary { color: var(--custom-primary); }
        .border-custom-primary { border-color: var(--custom-primary); }
        .shadow-custom-primary { box-shadow: 0 4px 14px 0 var(--custom-primary); }
      `}</style>

      {/* Floating WhatsApp Button */}
      <a
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
        href={data.social.whatsapp}
        target="_blank"
        rel="noreferrer"
      >
        <svg
          className="h-8 w-8"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.5-5.613-1.426l-6.354 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.906 6.03.21.262.35.581.401.921l-.525 1.922 1.996-.52z"></path>
        </svg>
      </a>

      {/* Main Content */}
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center">
          <div className="flex w-full flex-col">
            {/* TopNavBar */}
            <header 
              className="sticky top-0 z-40 flex w-full justify-center whitespace-nowrap border-b border-[var(--primary)]/30 px-6 py-3 backdrop-blur-sm md:px-10"
              style={{ backgroundColor: `${data.theme.backgroundColor}E6` }}
            >
              <div className="flex w-full max-w-7xl items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-5 text-[var(--primary)]">
                    <svg
                      fill="none"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z"
                        fill="currentColor"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: data.theme.textColor }}>
                    {data.hero.name} Trainer
                  </h2>
                </div>
                <nav className="hidden items-center gap-8 md:flex">
                  <a
                    className="text-sm font-medium transition-colors hover:text-[var(--primary)] opacity-90 hover:opacity-100"
                    style={{ color: data.theme.textColor }}
                    href="#sobre"
                  >
                    Sobre
                  </a>
                  <a
                    className="text-sm font-medium transition-colors hover:text-[var(--primary)] opacity-90 hover:opacity-100"
                    style={{ color: data.theme.textColor }}
                    href="#servicos"
                  >
                    Serviços
                  </a>
                  <a
                    className="text-sm font-medium transition-colors hover:text-[var(--primary)] opacity-90 hover:opacity-100"
                    style={{ color: data.theme.textColor }}
                    href="#planos"
                  >
                    Planos
                  </a>
                  <a
                    className="text-sm font-medium transition-colors hover:text-[var(--primary)] opacity-90 hover:opacity-100"
                    style={{ color: data.theme.textColor }}
                    href="#contato"
                  >
                    Contato
                  </a>
                  <a
                    href={data.social.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-custom-primary text-[#0d1b12] text-sm font-bold tracking-wide transition-transform hover:scale-105"
                  >
                    <span className="truncate">{data.hero.whatsappText}</span>
                  </a>
                </nav>
              </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:gap-20 md:px-6 md:py-16">
              {/* HeroSection */}
              <section className="w-full" id="hero">
                <div
                  className="flex min-h-[500px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-6 text-center shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(rgba(16, 34, 22, 0.5) 0%, rgba(16, 34, 22, 0.8) 100%), url("${data.hero.bannerImage}")`,
                  }}
                >
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-4xl font-black leading-tight tracking-tighter text-white md:text-6xl">
                      {data.hero.slogan}
                    </h1>
                    <h2 className="mx-auto max-w-2xl text-base font-normal leading-normal text-slate-200 md:text-lg">
                      {data.hero.subSlogan}
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                    <a
                      className={`flex min-w-[150px] cursor-pointer items-center justify-center overflow-hidden h-12 px-6 bg-custom-primary text-[#0d1b12] text-base font-bold tracking-wide transition-transform hover:scale-105 ${data.theme.buttonStyle}`}
                      href="#planos"
                    >
                      <span className="truncate">{data.hero.ctaText}</span>
                    </a>
                    <button
                      onClick={handleRequestLink}
                      disabled={requestStatus === 'loading' || requestStatus === 'success'}
                      className={`flex min-w-[150px] cursor-pointer items-center justify-center overflow-hidden h-12 px-6 bg-white/10 backdrop-blur-md border border-white/20 text-white text-base font-bold tracking-wide transition-transform ${requestStatus === 'idle' ? 'hover:scale-105 hover:bg-white/20' : ''} ${data.theme.buttonStyle}`}
                    >
                      {requestStatus === 'idle' && (
                        <>
                          <span className="material-symbols-outlined mr-2 text-[20px]">link</span>
                          Solicitar Vínculo
                        </>
                      )}
                      {requestStatus === 'loading' && 'Enviando...'}
                      {requestStatus === 'success' && (
                        <>
                          <span className="material-symbols-outlined mr-2 text-[20px]">check_circle</span>
                          Solicitado!
                        </>
                      )}
                      {requestStatus === 'error' && 'Erro! Tentar de novo'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Dynamic Sections */}
              {[
                { id: "about", priority: data.sections.about.order, visible: data.sections.about.visible },
                { id: "services", priority: data.sections.services.order, visible: data.sections.services.visible },
                { id: "testimonials", priority: data.sections.testimonials.order, visible: data.sections.testimonials.visible },
                { id: "gallery", priority: data.sections.gallery.order, visible: data.sections.gallery.visible },
                { id: "contact", priority: data.sections.contact.order, visible: data.sections.contact.visible },
              ]
                .filter((s) => s.visible)
                .sort((a, b) => a.priority - b.priority)
                .map((section) => {
                  if (section.id === "about") {
                    return (
                      <section className="flex flex-col gap-6" id="sobre" key="about">
                        <h2 className="text-3xl font-bold tracking-tight text-[#e0f5e7]">
                          {data.about.title || "Sobre Mim"}
                        </h2>
                        <div 
                          className={`flex w-full flex-col items-center gap-6 bg-[#182c1e] p-6 md:flex-row md:gap-8 md:p-8 shadow-sm ${data.theme.cardStyle}`}
                          style={{ backgroundColor: data.sections.about.backgroundColor !== "transparent" ? data.sections.about.backgroundColor : undefined }}
                        >
                          <div
                            className="h-40 w-40 flex-shrink-0 rounded-full bg-cover bg-center bg-no-repeat border-2 border-custom-primary/30"
                            style={{
                              backgroundImage: `url("${data.hero.profileImage}")`,
                            }}
                          ></div>
                          <div className="flex flex-col gap-2 text-center md:text-left">
                            <div className="flex flex-col gap-1 md:flex-row md:items-center">
                              <p className="text-2xl font-bold tracking-tight text-[#e0f5e7]">
                                {data.hero.name}
                              </p>
                              {data.about.cref && (
                                <span className="inline-block mt-1 md:mt-0 px-3 py-1 bg-custom-primary/10 text-custom-primary text-xs font-bold rounded-full w-max mx-auto md:mx-0 border border-custom-primary/20">
                                  {data.about.cref}
                                </span>
                              )}
                            </div>
                            <p className="text-[#8fc5a4] leading-relaxed whitespace-pre-wrap">
                              {data.about.description}
                            </p>
                            <p className="font-semibold text-custom-primary mt-2">
                              {data.about.cref}
                            </p>
                          </div>
                        </div>
                      </section>
                    );
                  }

                  if (section.id === "services") {
                    return (
                      <section className="flex flex-col gap-6" id="servicos" key="services">
                        <h2 className="text-3xl font-bold tracking-tight text-[#e0f5e7]">
                          Serviços Oferecidos
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {data.services.map((service) => (
                            <div
                              key={service.id}
                              className={`flex flex-col items-center gap-4 bg-[#182c1e] p-6 text-center shadow-sm hover:-translate-y-1 transition-transform ${data.theme.cardStyle}`}
                              style={{ backgroundColor: data.sections.services.backgroundColor !== "transparent" ? data.sections.services.backgroundColor : undefined }}
                            >
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-custom-primary/20 text-custom-primary">
                                <span className="material-symbols-outlined text-3xl">
                                  {service.icon}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-[#e0f5e7]">
                                {service.title}
                              </h3>
                              <p className="text-sm text-[#8fc5a4]">
                                {service.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (section.id === "testimonials") {
                    return (
                      <section className="flex flex-col gap-6" id="depoimentos" key="testimonials">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-[#e0f5e7]">
                          {data.testimonials.title || "O que meus alunos dizem"}
                        </h2>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mt-4">
                          {data.testimonials.items.map((testimonial) => (
                            <div
                              key={testimonial.id}
                              className={`flex flex-col justify-between gap-4 bg-[#182c1e] p-6 shadow-sm border border-transparent hover:border-[var(--primary)]/20 transition-colors ${data.theme.cardStyle}`}
                              style={{ backgroundColor: data.sections.testimonials.backgroundColor !== "transparent" ? data.sections.testimonials.backgroundColor : undefined }}
                            >
                              <p className="text-[#8fc5a4] italic">
                                "{testimonial.text}"
                              </p>
                              <div className="flex items-center gap-3 mt-4">
                                <div
                                  className="h-12 w-12 rounded-full bg-cover bg-center border border-[var(--primary)]/30"
                                  style={{
                                    backgroundImage: `url("${testimonial.image}")`,
                                  }}
                                ></div>
                                <div>
                                  <p className="font-bold text-[#e0f5e7]">
                                    {testimonial.name}
                                  </p>
                                  <p className="text-sm text-[#8fc5a4]">
                                    {testimonial.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (section.id === "gallery") {
                    return (
                      <section className="flex flex-col gap-6" id="galeria" key="gallery">
                        <h2 className="text-3xl font-bold tracking-tight text-[#e0f5e7]">
                          {data.results.title || "Galeria de Resultados"}
                        </h2>
                        <div 
                          className={`p-6 bg-[#182c1e] shadow-sm ${data.theme.cardStyle}`}
                          style={{ backgroundColor: data.sections.gallery.backgroundColor !== "transparent" ? data.sections.gallery.backgroundColor : undefined }}
                        >
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mt-2">
                            {data.results.items.map((res) => (
                              <div
                                key={res.id}
                                className="aspect-square w-full rounded-lg bg-cover bg-center border border-[var(--primary)]/20 shadow-sm hover:scale-105 transition-transform duration-300"
                                style={{ backgroundImage: `url("${res.image}")` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </section>
                    );
                  }

                  if (section.id === "contact") {
                    return (
                      <section
                        className={`flex flex-col gap-6 bg-[#182c1e] p-6 md:p-8 shadow-sm border border-[var(--primary)]/10 ${data.theme.cardStyle}`}
                        id="contato"
                        key="contact"
                        style={{ backgroundColor: data.sections.contact.backgroundColor !== "transparent" ? data.sections.contact.backgroundColor : undefined }}
                      >
                        <div className="text-center">
                          <h2 className="text-3xl font-bold tracking-tight text-[#e0f5e7]">
                            {data.contact.title || "Fale Comigo"}
                          </h2>
                          <p className="mt-2 text-[#8fc5a4]">
                            {data.contact.description || "Preencha o formulário abaixo para tirar dúvidas ou agendar sua primeira aula."}
                          </p>
                        </div>
                        <form className="mx-auto w-full max-w-xl space-y-4 mt-4">
                          <div>
                            <label className="sr-only" htmlFor="name">
                              Nome
                            </label>
                            <input
                              className="w-full rounded-lg border-[var(--primary)]/30 bg-[#102216]/50 p-3 text-sm text-[#e0f5e7] focus:border-[var(--primary)] focus:ring-[var(--primary)] outline-none"
                              id="name"
                              placeholder="Seu nome"
                              type="text"
                            />
                          </div>
                          <div>
                            <label className="sr-only" htmlFor="email">
                              Email
                            </label>
                            <input
                              className="w-full rounded-lg border-[var(--primary)]/30 bg-[#102216]/50 p-3 text-sm text-[#e0f5e7] focus:border-[var(--primary)] focus:ring-[var(--primary)] outline-none"
                              id="email"
                              placeholder="Seu melhor email"
                              type="email"
                            />
                          </div>
                          <div>
                            <label className="sr-only" htmlFor="message">
                              Mensagem
                            </label>
                            <textarea
                              className="w-full rounded-lg border-[var(--primary)]/30 bg-[#102216]/50 p-3 text-sm text-[#e0f5e7] focus:border-[var(--primary)] focus:ring-[var(--primary)] outline-none resize-none"
                              id="message"
                              placeholder="Sua mensagem..."
                              rows={5}
                            ></textarea>
                          </div>
                          <button
                            className={`w-full cursor-pointer bg-custom-primary px-5 py-3 font-bold text-[#0d1b12] transition-transform hover:scale-[1.02] ${data.theme.buttonStyle}`}
                            type="submit"
                          >
                            Enviar Mensagem
                          </button>
                        </form>
                      </section>
                    );
                  }

                  return null;
                })}

              {/* Planos e Preços - FIXED SECTION ALWAYS VISIBLE (for demonstration synced with real plans) */}
              <section className="flex flex-col gap-6 text-center" id="planos">
                <h2 className="text-3xl font-bold tracking-tight text-[#e0f5e7]">
                  Escolha seu Plano
                </h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mt-4">
                  {data.plans.filter(p => {
                    const isTargetToRenew = renewingPlanName && p.name === renewingPlanName;

                    if (p.hiddenGlobal) {
                      if (isTargetToRenew && p.allowHiddenRenewal) {
                        return true;
                      }
                      return false;
                    }
                    if (p.displayOnLandingPage === false) {
                      if (isTargetToRenew) return true;
                      return false;
                    }
                    return true;
                  }).map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex flex-col bg-[#182c1e] p-6 text-left transition-transform ${plan.isPopular ? "border-2 border-custom-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] scale-105 z-10 hover:scale-110" : "border border-[var(--primary)]/30 hover:scale-[1.02]"} ${data.theme.cardStyle}`}
                    >
                      {plan.isPopular && (
                        <p className="self-start rounded-full bg-custom-primary px-3 py-1 text-xs font-bold uppercase text-[#0d1b12] mb-4">
                          Mais Popular
                        </p>
                      )}
                      <h3
                        className={`text-xl font-bold text-[#e0f5e7] ${!plan.isPopular && "mt-4"}`}
                      >
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-[var(--primary)] text-sm opacity-70">schedule</span>
                        <span className="text-[#8fc5a4] text-xs font-bold uppercase tracking-widest">{plan.durationDays} Dias de acesso</span>
                      </div>
                      <p className="mt-3 text-4xl font-black text-[#e0f5e7]">
                        {plan.showPriceOnLandingPage === false ? (
                           <span className="text-2xl tracking-normal">Consultar Valor</span>
                        ) : (
                           <>
                             {plan.price}
                             <span className="text-base font-medium text-[#8fc5a4]">
                               /total
                             </span>
                           </>
                        )}
                      </p>
                      <ul className="mt-6 flex-grow space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-[#8fc5a4]"
                          >
                            <span className="material-symbols-outlined text-custom-primary text-lg">
                              check_circle
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => plan.showPriceOnLandingPage === false ? handleConsultPlan(plan) : handleJoinPlan(plan)}
                        disabled={paymentLoading === plan.id}
                        className={`mt-6 w-full cursor-pointer px-4 py-3 text-sm font-bold transition-all ${plan.isPopular ? "bg-custom-primary text-[#0d1b12] hover:brightness-110" : "bg-custom-primary/10 text-custom-primary border border-custom-primary/30 hover:bg-custom-primary/20"} ${data.theme.buttonStyle} disabled:opacity-50`}
                      >
                        {paymentLoading === plan.id ? 'Aguarde...' : (plan.showPriceOnLandingPage === false ? 'Consultar Valor' : 'Quero este plano')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--primary)]/30 px-6 py-8 md:px-10 mt-auto flex justify-center">
              <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-[#8fc5a4]">
                  © {new Date().getFullYear()} {data.hero.name} Trainer. Todos
                  os direitos reservados.
                </p>
                <div className="flex items-center gap-4">
                  <a
                    aria-label="Instagram"
                    className="text-[#8fc5a4] hover:text-custom-primary transition-colors"
                    href={data.social.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 012.127 2.127c.248.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-2.127 2.127c-.636.248-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-2.127-2.127c-.248-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 012.127-2.127c.636-.248 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zM12 0C9.58 0 9.22.01 8.16.059c-1.164.053-1.986.223-2.72.512a6.898 6.898 0 00-2.52 1.61 6.898 6.898 0 00-1.61 2.52c-.289.734-.46 1.556-.512 2.72C.01 9.22 0 9.58 0 12s.01 2.78.059 3.84c.053 1.164.223 1.986.512 2.72a6.898 6.898 0 001.61 2.52 6.898 6.898 0 002.52 1.61c.734.289 1.556.46 2.72.512 1.06.049 1.42.059 3.84.059s2.78-.01 3.84-.059c1.164-.053 1.986-.223 2.72-.512a6.898 6.898 0 002.52-1.61 6.898 6.898 0 001.61-2.52c.289-.734.46-1.556.512-2.72.049-1.06.059-1.42.059-3.84s-.01-2.78-.059-3.84c-.053-1.164-.223-1.986-.512-2.72a6.898 6.898 0 00-1.61-2.52A6.898 6.898 0 0017.28.57c-.734-.289-1.556-.46-2.72-.512C13.52.01 13.16 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"
                      ></path>
                    </svg>
                  </a>
                  <a
                    aria-label="Facebook"
                    className="text-[#8fc5a4] hover:text-custom-primary transition-colors"
                    href={data.social.facebook}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      ></path>
                    </svg>
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLandingPage;
