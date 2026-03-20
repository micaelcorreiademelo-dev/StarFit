
import React from 'react';

const TrainerLandingPage: React.FC = () => {
  return (
    <div className="relative flex flex-col bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark min-h-screen overflow-x-hidden rounded-2xl border border-border-dark">
      {/* Floating WhatsApp Button */}
      <a 
        className="fixed bottom-10 right-10 z-[60] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-transform hover:scale-110 active:scale-95" 
        href="#"
        onClick={(e) => e.preventDefault()}
      >
        <svg className="h-8 w-8" fill="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.5-5.613-1.426l-6.354 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.906 6.03.21.262.35.581.401.921l-.525 1.922 1.996-.52z"></path>
        </svg>
      </a>

      {/* Main Content Wrapper */}
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-5xl flex-col">
          {/* TopNavBar */}
          <header className="sticky top-0 z-40 flex w-full items-center justify-between whitespace-nowrap border-b border-primary/20 bg-background-light/80 px-6 py-4 backdrop-blur-sm dark:border-primary/30 dark:bg-background-dark/80">
            <div className="flex items-center gap-3 text-text-light dark:text-text-dark">
              <div className="size-5 text-primary">
                <svg fill="none" viewbox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fill-rule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold tracking-tight">Alex Lima Trainer</h2>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <a className="text-sm font-medium text-text-light hover:text-primary dark:text-text-dark dark:hover:text-primary transition-colors" href="#sobre">Sobre</a>
              <a className="text-sm font-medium text-text-light hover:text-primary dark:text-text-dark dark:hover:text-primary transition-colors" href="#servicos">Serviços</a>
              <a className="text-sm font-medium text-text-light hover:text-primary dark:text-text-dark dark:hover:text-primary transition-colors" href="#planos">Planos</a>
              <a className="text-sm font-medium text-text-light hover:text-primary dark:text-text-dark dark:hover:text-primary transition-colors" href="#contato">Contato</a>
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                <span className="truncate">Agende sua Aula</span>
              </button>
            </nav>
          </header>

          <main className="flex flex-col gap-12 px-4 py-8 md:gap-20 md:px-6 md:py-16">
            {/* HeroSection */}
            <section className="w-full" id="hero">
              <div 
                className="flex min-h-[500px] flex-col items-center justify-center gap-6 rounded-3xl bg-cover bg-center bg-no-repeat p-8 text-center shadow-2xl relative overflow-hidden" 
                style={{ 
                  backgroundImage: 'linear-gradient(rgba(16, 34, 22, 0.5) 0%, rgba(16, 34, 22, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBodf_pr2A6i_44X5MQ2OAS514niIBbWvaKzdmvLRow5mlXrXvtN5ylA323mT6NTj32jSzOOiXJdNUTAsNVl8QLYp_DTr7ClLZQXBZtzmqCVSc0im-f9gcxF2noBOGCgcakE1fppbThCdYVwNhzwwx0F6zRXEvPh8h3_dXwwZPowZFdO40queYo_0OhGaybb3J1flsAVe3lQNHglTEVI-10TVmEpHkXVkko-lZ0HEuPM9VQ5WR41xBKEEDpzswZXeACrDtSNf_kAAg")' 
                }}
              >
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-8 duration-1000">
                  <h1 className="text-4xl font-black leading-tight tracking-tighter text-white md:text-6xl">Transforme seu Corpo e sua Vida</h1>
                  <h2 className="mx-auto max-w-2xl text-base font-normal leading-normal text-slate-200 md:text-lg">Alcance seus objetivos com um acompanhamento personalizado e profissional. Chega de desculpas, vamos treinar!</h2>
                </div>
                <a 
                  className="flex min-w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-primary text-background-dark text-lg font-black tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 animate-in fade-in zoom-in duration-1000 delay-500" 
                  href="#planos"
                >
                  <span className="truncate">Comece Agora</span>
                </a>
              </div>
            </section>

            {/* ProfileHeader / Sobre Mim */}
            <section className="flex flex-col gap-8" id="sobre">
              <h2 className="text-4xl font-black tracking-tight text-text-light dark:text-white border-l-4 border-primary pl-4">Sobre Mim</h2>
              <div className="flex w-full flex-col items-center gap-8 rounded-3xl bg-surface-light p-8 dark:bg-card-dark md:flex-row md:gap-12 md:p-12 shadow-sm border border-border-dark/50">
                <div 
                  className="h-56 w-56 flex-shrink-0 rounded-full bg-cover bg-center bg-no-repeat border-4 border-primary/20 shadow-xl" 
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC3le6RtZuj7OTouysR-yPC2mk5Hv60BeO71uo8VCeJ0NQFwqu16M7FvAphw0ub_a-PmIyHrQ3Q3MQ5WolY4X8X7V3FSgR-844hEtY88MN7F0Vj0J9o7EQhdOoCaUOSvos6w18VWcsM48NMMrtjcAISQWvy3tqowRCOFfSiNR4nFc3AaEp2BIG1wS0U6vnqyE7Bgl870X5Ynq6TCPEAZ6_ANLxADwKiStEUQFsjq1GnMIgv_mtjvC_aw-ZZw1qqg0JF5WVOgz0rILo")' }}
                ></div>
                <div className="flex flex-col gap-4 text-center md:text-left">
                  <div>
                    <p className="text-3xl font-black tracking-tight text-text-light dark:text-white">Alex Lima</p>
                    <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">Personal Trainer & Coach</p>
                  </div>
                  <p className="text-lg leading-relaxed text-text-light/80 dark:text-text-secondary">
                    Com mais de 10 anos de experiência, minha paixão é ajudar pessoas a descobrirem seu potencial máximo através do fitness. Minha filosofia é simples: treino inteligente, nutrição equilibrada e consistência.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full w-fit mx-auto md:mx-0">
                    <span className="material-symbols-outlined text-primary text-xl">verified</span>
                    <p className="font-bold text-primary text-sm">CREF: 012345-G/SP</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Serviços Oferecidos */}
            <section className="flex flex-col gap-8" id="servicos">
              <h2 className="text-4xl font-black tracking-tight text-text-light dark:text-white border-l-4 border-primary pl-4 text-left">Serviços</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface-light p-8 text-center dark:bg-card-dark border border-border-dark/30 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-background-dark transition-all duration-300">
                    <span className="material-symbols-outlined text-4xl">fitness_center</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-black dark:text-white">Musculação</h3>
                    <p className="text-base text-text-light/70 dark:text-text-secondary leading-relaxed">Planos de treino focados em hipertrofia e ganho de força, adaptados para todos os níveis.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface-light p-8 text-center dark:bg-card-dark border border-border-dark/30 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-background-dark transition-all duration-300">
                    <span className="material-symbols-outlined text-4xl">directions_run</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-black dark:text-white">Funcional</h3>
                    <p className="text-base text-text-light/70 dark:text-text-secondary leading-relaxed">Melhore sua performance diária com treinos dinâmicos que trabalham o corpo de forma integrada.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface-light p-8 text-center dark:bg-card-dark border border-border-dark/30 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-background-dark transition-all duration-300">
                    <span className="material-symbols-outlined text-4xl">monitoring</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-black dark:text-white">Consultoria</h3>
                    <p className="text-base text-text-light/70 dark:text-text-secondary leading-relaxed">Receba seu plano de treino e suporte completo à distância, para treinar onde e quando quiser.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Planos e Preços */}
            <section className="flex flex-col gap-8 text-center" id="planos">
              <h2 className="text-4xl font-black tracking-tight text-text-light dark:text-white mb-4">Escolha seu Plano</h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-stretch">
                {/* Bronze */}
                <div className="flex flex-col rounded-3xl border border-border-dark bg-surface-light p-8 text-left dark:bg-card-dark hover:border-primary/30 transition-all shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-text-light dark:text-white uppercase tracking-widest text-primary">Bronze</h3>
                    <p className="mt-2 text-5xl font-black text-text-light dark:text-white">R$150<span className="text-base font-medium text-text-secondary">/mês</span></p>
                  </div>
                  <ul className="flex-grow space-y-4">
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Consultoria Online
                    </li>
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Planilha de Treino Mensal
                    </li>
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Suporte via WhatsApp
                    </li>
                  </ul>
                  <button className="mt-8 w-full cursor-pointer rounded-xl bg-primary/10 py-4 text-sm font-black text-primary transition-all hover:bg-primary hover:text-background-dark border border-primary/20">Quero este plano</button>
                </div>

                {/* Prata (Featured) */}
                <div className="flex flex-col rounded-3xl border-2 border-primary bg-surface-light p-8 text-left dark:bg-[#152a1d] transform md:scale-110 z-10 shadow-2xl shadow-primary/10 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-background-dark text-xs font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-tighter">
                    Mais Popular
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-text-light dark:text-white uppercase tracking-widest text-primary">Prata</h3>
                    <p className="mt-2 text-6xl font-black text-text-light dark:text-white">R$300<span className="text-base font-medium text-text-secondary">/mês</span></p>
                  </div>
                  <ul className="flex-grow space-y-4">
                    <li className="flex items-start gap-3 text-text-light dark:text-white font-semibold text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Acompanhamento Presencial 2x
                    </li>
                    <li className="flex items-start gap-3 text-text-light dark:text-white font-semibold text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Planilha Individualizada
                    </li>
                    <li className="flex items-start gap-3 text-text-light dark:text-white font-semibold text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Avaliação Física Trimestral
                    </li>
                    <li className="flex items-start gap-3 text-text-light dark:text-white font-semibold text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Suporte Prioritário 24h
                    </li>
                  </ul>
                  <button className="mt-8 w-full cursor-pointer rounded-xl bg-primary py-4 text-sm font-black text-background-dark transition-all hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95">Quero este plano</button>
                </div>

                {/* Ouro */}
                <div className="flex flex-col rounded-3xl border border-border-dark bg-surface-light p-8 text-left dark:bg-card-dark hover:border-primary/30 transition-all shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-text-light dark:text-white uppercase tracking-widest text-primary">Ouro</h3>
                    <p className="mt-2 text-5xl font-black text-text-light dark:text-white">R$500<span className="text-base font-medium text-text-secondary">/mês</span></p>
                  </div>
                  <ul className="flex-grow space-y-4">
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Acompanhamento Presencial 4x
                    </li>
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Tudo do Plano Prata
                    </li>
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Ajustes em Tempo Real
                    </li>
                    <li className="flex items-start gap-3 text-text-light/80 dark:text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary !text-xl fill">check_circle</span>
                      Kit Exclusivo StarFit
                    </li>
                  </ul>
                  <button className="mt-8 w-full cursor-pointer rounded-xl bg-primary/10 py-4 text-sm font-black text-primary transition-all hover:bg-primary hover:text-background-dark border border-primary/20">Quero este plano</button>
                </div>
              </div>
            </section>

            {/* Depoimentos */}
            <section className="flex flex-col gap-10" id="depoimentos">
              <h2 className="text-center text-4xl font-black tracking-tight text-text-light dark:text-white">Resultados Reais</h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-6 rounded-3xl bg-surface-light p-8 dark:bg-card-dark border border-border-dark/20 relative shadow-sm">
                  <span className="material-symbols-outlined absolute top-6 right-8 text-primary/20 !text-6xl">format_quote</span>
                  <p className="text-lg italic leading-relaxed text-text-light/90 dark:text-text-secondary">"O melhor investimento que fiz na minha saúde! O Alex é um profissional incrível, sempre motivando e ajustando o treino para os meus objetivos. Já perdi 10kg em 3 meses!"</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div 
                      className="h-14 w-14 rounded-full bg-cover bg-center border-2 border-primary/20 shadow-md" 
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCG6oQIoFHifdFGhKdgQqypHWsfeaTEXQW66LeiGMrFO44sJHSspXzDxdGnXRun_gtAdDLB36hyUerCxJIeu5NoyyvXxNtdZjG7cw6P-9X6EaVQraLI6R2xYkYqTSJVO2rrMXI544tNCK_iFSk4Z0eVGvv-eAAlBGIIej2AyHhvmqNM5hmLX3DyDVS6VsFWukWn9OyhzEVF4vt6eUWyIr3241yTK8UFTFPo-pdAQR91-eWHb_a6swveFfNicxFuVVP0CfiSrH5rs8k")' }}
                    ></div>
                    <div>
                      <p className="font-black text-text-light dark:text-white">Mariana Costa</p>
                      <p className="text-sm font-bold text-primary uppercase">Aluna de Consultoria</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-6 rounded-3xl bg-surface-light p-8 dark:bg-card-dark border border-border-dark/20 relative shadow-sm">
                  <span className="material-symbols-outlined absolute top-6 right-8 text-primary/20 !text-6xl">format_quote</span>
                  <p className="text-lg italic leading-relaxed text-text-light/90 dark:text-text-secondary">"Finalmente consegui sair do sedentarismo. Os treinos são desafiadores, mas divertidos. A atenção que ele dá durante as aulas presenciais faz toda a diferença."</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div 
                      className="h-14 w-14 rounded-full bg-cover bg-center border-2 border-primary/20 shadow-md" 
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBJ0spbGfhLmtjmHyxI_-wA8LS19vYzdZNMk3zRnSMTtxF9xJ1d8_V_X9jkqGgHQMwpDEW01GsD5hJQ3-qd3WlZGbOBeJ_ln1om1gwmu_-R-gyDfapsy3vBqyL7dcbPN8vPdQgYTTkShNwBiQE2gnzTPdulDNFdtNjbYl1V6QlYaxmcV1uTOJa48ETOpV432LcUjCzni97sxsyfBOIQDTOCpoIA2fZZAdHFz5TWW6yugbPvJGg1plByiZ72AMGq9mIDtlA66NMK6nA")' }}
                    ></div>
                    <div>
                      <p className="font-black text-text-light dark:text-white">João Ferreira</p>
                      <p className="text-sm font-bold text-primary uppercase">Aluno Presencial</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Galeria */}
            <section className="flex flex-col gap-8" id="galeria">
              <h2 className="text-4xl font-black tracking-tight text-text-light dark:text-white border-l-4 border-primary pl-4">Galeria</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDIdJNdHAqPS_Kt7JeQl-T14zFi_-Oe6T6K2jDJ0eWM-92dMKEC31yJxgq0lIA8DcQInks_nviQpe7OFG8AOoDhoQC6-gOrC8QoHGEfYzmJzorGLLVNjGpqvIeJ3saJUza6nACWoD3j2rl4cmF0yltEvz_6uNPxiljUdllZ5zeDUdK5S8zcINFS2QRGtL6yoYeFtHzmTRB8C9uWHxgI8Kdu5mtdyJmFM6sE6_2Cwq2Nhep78pcevKcb59FqTAh44EYKzyleJdi5CZM",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuCpfmXHSpJ2RsrVtJ7em4ac57VvOsZrjxqwJ9fetGG_VxWWeOScyy7bFzsESaAtaaNkV1JMjtkHPwsXPpPMsQBA2jO0w-IHHttuLp1lvS6wfsUAipmFlGzCS-GuWKCCIpu4FPb5v6nzwULgcj2eSwlnsRXc09d25OPzijQK71OFOjoR-6zGpSFq7OxPNfQhSv5nyZXQ7dfhjM-TBc-GFtMQUX9GGJu7L0HGq5eg3Cw_lUm5eoFhAgurXZ1QOQsfRu4AS4AUSXuj7nM",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBqBq0M2r_EjlTznFt5EmUv7K5geVxundFIIIsC9XSM3QzB2rfcRbwvNreNKzyAxqMoIpZYD8iFzcLUt0zvUo1BH5DU0RMOHZVeUT6piH28ii3Ub6X6WW-8Bdt1kMVESaqTDlu7ru9NnUvyNtyGaNMt4O7jszRAP5RMfKZlCcgf-2JAUivoweZk7WrkczNZ20WO-fiZ2RSe3eBv7_Vjs6EFaVH08tw5DaoCOpSraeJ5lnjB5dVLjimM7i6eRiAJwX5ygxxdMeNzExE",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAgfdNFwZ4ek6H4x59mIj_FKsb0YETZzZ3HkTfo7iDHzgWRmYSBmSQ-S4HfyBrZj623u4nYRL-D3-FMRAhLZ2d77Et7Bo24DQDYeT_8L_MsXAbsM2zaZYGFyNfAmq44c92FQyi3cyANfX1aDA0iyWHdXnDNLj4gR1giZxjdPluhqQndCiqlgBYevc5YLBp62VQJzerYjHUL-RRDr0h8NohU41TS5mJCk8lQKtSzqyq5IlE0cW9KsGFOKc7FENVCxay2-xcpHHGKXLo"
                ].map((url, i) => (
                  <div 
                    key={i} 
                    className="aspect-square w-full rounded-2xl bg-cover bg-center border border-border-dark/20 shadow-lg hover:scale-[1.03] transition-transform cursor-pointer" 
                    style={{ backgroundImage: `url("${url}")` }}
                  ></div>
                ))}
              </div>
            </section>

            {/* Contato */}
            <section className="flex flex-col gap-8 rounded-3xl bg-primary text-background-dark p-8 md:p-12 shadow-2xl relative overflow-hidden" id="contato">
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-background-dark opacity-10 rounded-full blur-3xl"></div>
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl"></div>
              
              <div className="text-center relative z-10">
                <h2 className="text-4xl font-black tracking-tight">Fale Comigo</h2>
                <p className="mt-3 text-background-dark/80 font-medium max-w-xl mx-auto">Preencha o formulário abaixo para tirar dúvidas ou agendar sua primeira aula.</p>
              </div>
              <form className="mx-auto w-full max-w-xl space-y-5 relative z-10" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <input className="w-full rounded-xl border-none bg-white/20 p-4 text-sm text-background-dark placeholder-background-dark/60 focus:bg-white/30 focus:ring-0 transition-all font-bold" placeholder="Seu nome" type="text" />
                </div>
                <div>
                  <input className="w-full rounded-xl border-none bg-white/20 p-4 text-sm text-background-dark placeholder-background-dark/60 focus:bg-white/30 focus:ring-0 transition-all font-bold" placeholder="Seu melhor email" type="email" />
                </div>
                <div>
                  <textarea className="w-full rounded-xl border-none bg-white/20 p-4 text-sm text-background-dark placeholder-background-dark/60 focus:bg-white/30 focus:ring-0 transition-all font-bold" placeholder="Sua mensagem..." rows={4}></textarea>
                </div>
                <button className="w-full cursor-pointer rounded-xl bg-background-dark px-5 py-4 font-black text-primary transition-all hover:scale-105 active:scale-95 shadow-xl">
                  Enviar Mensagem
                </button>
              </form>
            </section>
          </main>

          {/* Footer */}
          <footer className="border-t border-border-dark px-6 py-12 text-center md:text-left">
            <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-text-light dark:text-white">
                  <div className="size-5 text-primary">
                    <svg fill="none" viewbox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path clip-rule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fill-rule="evenodd"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">StarFit Ecosystem</h2>
                </div>
                <p className="text-sm text-text-secondary">© 2024 Alex Lima Trainer. Todos os direitos reservados.</p>
              </div>
              <div className="flex items-center gap-6">
                <a className="text-text-secondary hover:text-primary transition-colors p-2 bg-card-dark rounded-full" href="#">
                  <svg className="h-6 w-6" fill="currentColor" viewbox="0 0 24 24"><path clip-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 012.127 2.127c.248.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-2.127 2.127c-.636.248-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-2.127-2.127c-.248-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 012.127-2.127c.636-.248 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zM12 0C9.58 0 9.22.01 8.16.059c-1.164.053-1.986.223-2.72.512a6.898 6.898 0 00-2.52 1.61 6.898 6.898 0 00-1.61 2.52c-.289.734-.46 1.556-.512 2.72C.01 9.22 0 9.58 0 12s.01 2.78.059 3.84c.053 1.164.223 1.986.512 2.72a6.898 6.898 0 001.61 2.52 6.898 6.898 0 002.52 1.61c.734.289 1.556.46 2.72.512 1.06.049 1.42.059 3.84.059s2.78-.01 3.84-.059c1.164-.053 1.986-.223 2.72-.512a6.898 6.898 0 002.52-1.61 6.898 6.898 0 001.61-2.52c.289-.734.46-1.556.512-2.72.049-1.06.059-1.42.059-3.84s-.01-2.78-.059-3.84c-.053-1.164-.223-1.986-.512-2.72a6.898 6.898 0 00-1.61-2.52A6.898 6.898 0 0017.28.57c-.734-.289-1.556-.46-2.72-.512C13.52.01 13.16 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" fill-rule="evenodd"></path></svg>
                </a>
                <a className="text-text-secondary hover:text-primary transition-colors p-2 bg-card-dark rounded-full" href="#">
                  <svg className="h-6 w-6" fill="currentColor" viewbox="0 0 24 24"><path clip-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill-rule="evenodd"></path></svg>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TrainerLandingPage;
