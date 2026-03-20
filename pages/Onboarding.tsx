
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Boas-vindas ao StarFit!",
      desc: "Vamos completar seu perfil para uma experiência personalizada.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1y3nhRvixaQkjXsrYkYBPVu2897XB2Fq5L31Dnci1oV7_jIRkrHMheLfTd-I-kYW1c8HYQP2Rcet5nDlA1d7sUfafORIpczcXEteae78qHYC1qQxGYdd84979QU38pZwoBYD_oVSja6K9ypaQZoSzRVrR0bAN6V1AmGrEEH1LR4aCxGzh29qE7suChichZpkNuZsQ_JsSkGiRSOTLE8-1T7PuM6Z5UuIcAK9K1RhkHtXl1oJUwp2WPhW0nU2DYRuGa6Ime6tnn2E"
    },
    {
      title: "Gerencie tudo com Facilidade",
      desc: "Use o painel para visualizar o progresso e alcançar suas metas.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRwG30m4PUXIFOeqbYRf8HRe5DPqkcRUBx3tN2H_zvQbT-f5VTaDDyjYTI4xIIuTVFpDF1QASMS_020YcLLZ22OiBrzCpRuXvNWoirBWbcExTRB8GP9rrmuecaIiRc80rstrsBtjAwaU65Ph3wIteEklxZRaG_avzquxPFGa_xLNkPQBWAnUMAUwhSx7eWCw7uilBgMEtIa8eFEVh7ulu9ZMpCUkktK76mqpk9L9bftArxDqbgyTQQ54cyAkzp8bkTmfaS4wmb14U"
    },
    {
      title: "Tudo pronto para começar!",
      desc: "Explore seu painel e transforme seus objetivos em realidade.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLqlbRsPawPnUHwhivdvIiBQ0KT_WqlQyvGR0wI43LizVgI_SJuUYZOcu96sqFJaiI316XgAzviAInLajnkxrU3jXUVHyAlnJ6teqVqnZ3-vjv8ygTjSe7eNG66tkzwGOgzvkojhXvODFQyJZ3N2u61WLdsuPMgOf_1kSz4t5pjAauRwghQNYZNyfZPjfz2nRA9DHvujvIlfxEayaNQRrLKJZPHst6sUf0IWHut_RWpPfGfZEJuJf6VnH04w7e9C_NO79dK6ko-3Y"
    }
  ];

  const next = () => {
    if (step === steps.length - 1) onComplete();
    else setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark p-4">
      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : 'w-2 bg-primary/20'}`} />
          ))}
        </div>

        <div className="w-full bg-card-dark rounded-2xl overflow-hidden shadow-2xl border border-border-dark">
          <div 
            className="w-full aspect-video bg-cover bg-center" 
            style={{ backgroundImage: `url(${steps[step].img})` }} 
          />
          <div className="p-8 text-center flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{steps[step].title}</h2>
              <p className="text-text-secondary mt-2">{steps[step].desc}</p>
            </div>
            <button 
              onClick={next}
              className="w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {step === steps.length - 1 ? 'Vamos começar!' : 'Próximo'}
            </button>
          </div>
        </div>

        <button onClick={onComplete} className="text-text-secondary text-sm underline hover:text-primary transition-colors">
          Pular introdução
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
