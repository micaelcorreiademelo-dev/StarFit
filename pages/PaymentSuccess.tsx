import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const updateSubscription = async () => {
      if (!auth.currentUser) return;
      
      let durationDays = 30;
      const pendingCheckoutRaw = localStorage.getItem('pending_plan_checkout');
      if (pendingCheckoutRaw) {
        try {
          const pending = JSON.parse(pendingCheckoutRaw);
          durationDays = pending.durationDays || 30;
          localStorage.removeItem('pending_plan_checkout');
        } catch (e) {
          console.error("Error parsing pending checkout", e);
        }
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          paymentStatus: 'paid',
          subscriptionExpiry: expiryDate.toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error updating subscription:", err);
      }
    };

    updateSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6 text-white text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card-dark border border-border-dark p-10 rounded-3xl flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl">check_circle</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Pagamento Aprovado!</h1>
          <p className="text-text-secondary">
            Parabéns! Sua assinatura foi confirmada. Agora você pode acessar seus treinos e falar com seu personal.
          </p>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full h-14 bg-primary text-background-dark font-black rounded-xl hover:scale-105 transition-transform"
        >
          Ir para o Dashboard
        </button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
