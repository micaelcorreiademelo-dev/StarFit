import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/uploadService';
import { AssessmentCropperModal } from './AssessmentCropperModal';

interface StudentAssessmentsFlowProps {
  student: any;
  user: any; // Context user (Trainer or Student)
  onClose: () => void;
}

type FlowState = 'dashboard' | 'new-initial' | 'new-details' | 'history' | 'view';

export const StudentAssessmentsFlow: React.FC<StudentAssessmentsFlowProps> = ({ student, user, onClose }) => {
  const [flowState, setFlowState] = useState<FlowState>('dashboard');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  // New Assessment Data
  const [newAssessment, setNewAssessment] = useState<any>({
    weight: '',
    height: '',
    imc: 0,
    anamnese: { goal: '', injuries: '', restrictions: '', medicines: '', trainingHabits: '', eatingHabits: '' },
    antropometria: { neck: '', shoulders: '', chest: '', rightArm: '', leftArm: '', rightForearm: '', leftForearm: '', abdomen: '', waist: '', hips: '', rightThigh: '', leftThigh: '', rightCalf: '', leftCalf: '' },
    bodyComposition: { fatPercent: '', leanMass: '', muscleMass: '', boneMass: '', visceralFat: '', bmr: '', bodyWater: '' },
    parq: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false },
    postural: { observations: '', deviations: '', asymmetries: '', hyperlordosis: false, hyperkyphosis: false, scoliosis: false, freeObservations: '' },
    photos: { front: '', lateralRight: '', lateralLeft: '', back: '' }
  });

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Cropper States
  const [croppingPhotoType, setCroppingPhotoType] = useState<'front' | 'lateralRight' | 'lateralLeft' | 'back' | null>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('');

  useEffect(() => {
    fetchAssessments();
  }, [student.id]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      let q;
      if (user && user.id !== student.id && user.role !== 'admin') {
         q = query(
          collection(db, 'assessments'),
          where('studentId', '==', student.id),
          where('trainerId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
      } else {
         q = query(
          collection(db, 'assessments'),
          where('studentId', '==', student.id),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssessments(data);
    } catch (error) {
      console.error("Error fetching assessments", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIMC = (weight: string | number, height: string | number) => {
    const w = parseFloat(weight.toString().replace(',','.'));
    const h = parseFloat(height.toString().replace(',','.'));
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(2);
    }
    return '0.00';
  };

  const handleContinueInitial = () => {
    const imc = calculateIMC(newAssessment.weight, newAssessment.height);
    setNewAssessment({ ...newAssessment, imc });
    setFlowState('new-details');
  };

  const handleSaveAssessment = async () => {
    if (!newAssessment.weight || !newAssessment.height) {
      alert("Peso e altura são obrigatórios.");
      return;
    }
    
    setSaving(true);
    try {
      const assessmentData = {
        ...newAssessment,
        studentId: student.id,
        trainerId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'assessments'), assessmentData);

      // Sync latest weight/height back to the user profile
      const userRef = doc(db, 'users', student.id);
      await updateDoc(userRef, {
        weight: newAssessment.weight,
        height: newAssessment.height
      });

      alert("Avaliação salva com sucesso!");
      await fetchAssessments();
      setFlowState('dashboard');
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert("Erro ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    let arr = dataurl.split(','), mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    let mime = mimeMatch[1];
    let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'lateralRight' | 'lateralLeft' | 'back') => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropperImageSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setCroppingPhotoType(type);
      e.target.value = ''; // Reset file input
    }
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    if (!croppingPhotoType) return;
    
    // Quick optimistic visual
    setNewAssessment((prev: any) => ({
      ...prev,
      photos: { ...prev.photos, [croppingPhotoType]: croppedDataUrl }
    }));
    
    try {
      const blob = dataURLtoBlob(croppedDataUrl);
      if (!blob) throw new Error("Falha na conversão da imagem");
      
      const file = new File([blob], `${croppingPhotoType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const result = await uploadImage(file, { userId: student.id, folder: `assessments/${student.id}` }, setUploadProgress);
      
      setNewAssessment((prev: any) => ({
        ...prev,
        photos: { ...prev.photos, [croppingPhotoType]: result.url }
      }));
    } catch (err) {
      console.error("Upload error", err);
      alert("Erro no upload da foto.");
      // Rollback optimistic visual if failed
      setNewAssessment((prev: any) => ({
        ...prev,
        photos: { ...prev.photos, [croppingPhotoType]: '' }
      }));
    } finally {
      setUploadProgress(0);
      setCroppingPhotoType(null);
      setCropperImageSrc('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background-dark/95 backdrop-blur-md overflow-y-auto w-full h-full p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6 pb-20">
        
        {/* Superior Actions */}
        <div className="flex justify-between items-center bg-card-dark p-4 rounded-2xl border border-border-dark">
          <button onClick={onClose} className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-text-secondary hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="hidden md:inline font-bold">Voltar</span>
          </button>
          <h2 className="text-white text-lg md:text-xl font-bold">Avaliações Físicas</h2>
          <div className="w-10"></div> {/* Placeholder for centering */}
        </div>

        {/* Student Header */}
        <div className="flex items-center gap-4 bg-card-dark p-4 rounded-2xl border border-border-dark">
          {student.img || student.avatar ? (
            <img src={student.img || student.avatar} alt="Student" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            </div>
          )}
          <div>
            <h3 className="text-white font-bold text-lg">{student.name}</h3>
            <p className="text-text-secondary text-sm">Aluno vinculado</p>
          </div>
        </div>

        {/* --- STATE: DASHBOARD --- */}
        {flowState === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
            
            <div className="-mx-4 md:mx-0 md:px-0 flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 pb-4 md:pb-0">
              <div 
                className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-card-dark border border-border-dark p-5 rounded-2xl flex flex-col gap-2 cursor-pointer hover:border-primary transition-colors ml-4 md:ml-0"
                onClick={() => setFlowState('history')}
              >
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">history</span>
                  <p className="font-bold">Histórico</p>
                </div>
                <p className="text-white text-2xl font-black">{assessments.length}</p>
                <p className="text-text-secondary text-xs">Avaliações realizadas</p>
                {assessments.length > 0 && (
                  <p className="text-text-secondary text-xs mt-1">Última: {assessments[0].createdAt?.toDate ? new Date(assessments[0].createdAt.toDate()).toLocaleDateString() : 'Recente'}</p>
                )}
              </div>

              <div 
                className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-card-dark border border-border-dark p-5 rounded-2xl flex flex-col gap-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setFlowState('history')}
              >
                <div className="flex items-center gap-2 text-orange-400">
                  <span className="material-symbols-outlined">monitor_weight</span>
                  <p className="font-bold">Composição</p>
                </div>
                {assessments.length > 0 ? (
                  <>
                    <p className="text-white text-2xl font-black">{assessments[0].weight || '--'} kg</p>
                    <p className="text-text-secondary text-xs">IMC: {assessments[0].imc || '--'}</p>
                    <p className="text-text-secondary text-xs">Gordura: {assessments[0].bodyComposition?.fatPercent || '--'}%</p>
                  </>
                ) : (
                   <p className="text-text-secondary text-sm mt-2">Nenhuma avaliação inicial.</p>
                )}
              </div>

              <div 
                className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-card-dark border border-border-dark p-5 rounded-2xl flex flex-col gap-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setFlowState('history')}
              >
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="material-symbols-outlined">photo_camera</span>
                  <p className="font-bold">Evolução</p>
                </div>
                <p className="text-white text-2xl font-black">
                  {assessments.filter(a => a.photos?.front || a.photos?.back).length}
                </p>
                <p className="text-text-secondary text-xs">Registros fotográficos</p>
              </div>
              
              {/* Spacer for trailing edge on mobile */}
              <div className="w-4 shrink-0 md:hidden"></div>
            </div>

            <div className="bg-card-dark border border-border-dark p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-bold text-xl">Avaliações</h3>
                <p className="text-text-secondary text-sm">Registre ou consulte as avaliações físicas.</p>
              </div>
              <button 
                onClick={() => setFlowState('new-initial')}
                className="w-full md:w-auto h-12 px-6 bg-primary text-background-dark font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">add</span>
                <span className="whitespace-nowrap">Nova Avaliação</span>
              </button>
            </div>
          </div>
        )}

        {/* --- STATE: NEW INITIAL --- */}
        {flowState === 'new-initial' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-card-dark border border-border-dark p-6 rounded-2xl flex flex-col gap-6">
            <h3 className="text-white font-bold text-xl border-b border-border-dark pb-4">Nova Avaliação Física</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-bold ml-1">Peso (kg)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={newAssessment.weight}
                    onChange={(e) => setNewAssessment({...newAssessment, weight: e.target.value})}
                    placeholder="Ex: 75.5"
                    className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">kg</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-bold ml-1">Altura (m)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={newAssessment.height}
                    onChange={(e) => setNewAssessment({...newAssessment, height: e.target.value})}
                    placeholder="Ex: 1.75"
                    step="0.01"
                    className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">m</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleContinueInitial}
              disabled={!newAssessment.weight || !newAssessment.height}
              className="w-full h-12 bg-primary text-background-dark font-bold rounded-xl mt-4 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
            <button 
              onClick={() => setFlowState('dashboard')}
              className="w-full h-12 bg-transparent text-text-secondary font-bold rounded-xl border border-border-dark hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* --- STATE: NEW DETAILS (Modulos) --- */}
        {flowState === 'new-details' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-6">
            
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-primary text-xs font-bold uppercase">Resumo</span>
                <span className="text-white font-bold text-lg">{newAssessment.weight} kg <span className="text-text-secondary">|</span> {newAssessment.height} m</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-primary text-xs font-bold uppercase">IMC</span>
                <span className="text-white font-bold text-xl">{newAssessment.imc}</span>
              </div>
            </div>

            <h3 className="text-white font-bold mb-[-10px] ml-1">Módulos da Avaliação</h3>

            {/* Accordions / Cards list */}
            <div className="flex flex-col gap-4">
              <details className="bg-card-dark border border-border-dark rounded-xl group overflow-hidden">
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">assignment</span>
                    <span className="text-white font-bold">Anamnese</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="p-4 border-t border-border-dark flex flex-col gap-4">
                  {[
                    { key: 'goal', label: 'Objetivo do aluno' },
                    { key: 'injuries', label: 'Histórico de lesões' },
                    { key: 'restrictions', label: 'Restrições médicas' },
                    { key: 'medicines', label: 'Medicamentos' },
                    { key: 'trainingHabits', label: 'Hábitos de treino' },
                    { key: 'eatingHabits', label: 'Hábitos alimentares' },
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-text-secondary text-xs">{field.label}</label>
                      <textarea
                        value={newAssessment.anamnese[field.key]}
                        onChange={(e) => setNewAssessment({...newAssessment, anamnese: {...newAssessment.anamnese, [field.key]: e.target.value}})}
                        className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white text-sm min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              </details>

              <details className="bg-card-dark border border-border-dark rounded-xl group overflow-hidden">
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400">straighten</span>
                    <span className="text-white font-bold">Antropometria (cm)</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="p-4 border-t border-border-dark grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(newAssessment.antropometria).map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-text-secondary text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input
                        type="number"
                        value={newAssessment.antropometria[key]}
                        onChange={(e) => setNewAssessment({...newAssessment, antropometria: {...newAssessment.antropometria, [key]: e.target.value}})}
                        className="w-full h-10 bg-background-dark border border-border-dark rounded-lg px-3 text-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              </details>
              
              <details className="bg-card-dark border border-border-dark rounded-xl group overflow-hidden">
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-orange-400">vital_signs</span>
                    <span className="text-white font-bold">Composição Corporal</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="p-4 border-t border-border-dark grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(newAssessment.bodyComposition).map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-text-secondary text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input
                        type="number"
                        value={newAssessment.bodyComposition[key]}
                        onChange={(e) => setNewAssessment({...newAssessment, bodyComposition: {...newAssessment.bodyComposition, [key]: e.target.value}})}
                        className="w-full h-10 bg-background-dark border border-border-dark rounded-lg px-3 text-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              </details>

              <details className="bg-card-dark border border-border-dark rounded-xl group overflow-hidden">
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-red-400">medical_information</span>
                    <span className="text-white font-bold">PAR-Q</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="p-4 border-t border-border-dark flex flex-col gap-4">
                    {[
                      { key: 'q1', text: 'Algum médico já disse que você possui algum problema de coração e que só devia realizar atividade física supervisionado?' },
                      { key: 'q2', text: 'Você sente dores no peito quando pratica atividade física?' },
                      { key: 'q3', text: 'No último mês, você sentiu dores no peito quando praticou atividade física?' },
                      { key: 'q4', text: 'Você apresenta desequilíbrio devido a tontura ou perda de consciência?' },
                      { key: 'q5', text: 'Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?' },
                      { key: 'q6', text: 'Você toma atualmente algum medicamento para pressão arterial ou problema de coração?' },
                      { key: 'q7', text: 'Sabe de alguma outra razão pela qual você não deve praticar atividade física?' }
                    ].map((q) => (
                      <div key={q.key} className="flex flex-col gap-2 p-3 bg-background-dark/50 rounded-xl">
                        <p className="text-white text-sm">{q.text}</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-text-secondary text-sm">
                            <input 
                               type="radio" 
                               name={q.key} 
                               checked={newAssessment.parq[q.key] === true}
                               onChange={() => setNewAssessment({...newAssessment, parq: {...newAssessment.parq, [q.key]: true}})}
                               className="accent-primary w-4 h-4"
                            />
                            Sim
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-text-secondary text-sm">
                            <input 
                               type="radio" 
                               name={q.key} 
                               checked={newAssessment.parq[q.key] === false}
                               onChange={() => setNewAssessment({...newAssessment, parq: {...newAssessment.parq, [q.key]: false}})}
                               className="accent-primary w-4 h-4"
                            />
                            Não
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              </details>

              <details className="bg-card-dark border border-border-dark rounded-xl group overflow-hidden">
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-yellow-400">accessibility_new</span>
                    <span className="text-white font-bold">Avaliação Postural</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="p-4 border-t border-border-dark flex flex-col gap-4">
                   <div className="flex gap-4 flex-wrap mb-2">
                      <label className="flex items-center gap-2 text-white text-sm"><input type="checkbox" className="accent-primary w-4 h-4" checked={newAssessment.postural.hyperlordosis} onChange={(e) => setNewAssessment({...newAssessment, postural: {...newAssessment.postural, hyperlordosis: e.target.checked}})} /> Hiperlordose</label>
                      <label className="flex items-center gap-2 text-white text-sm"><input type="checkbox" className="accent-primary w-4 h-4" checked={newAssessment.postural.hyperkyphosis} onChange={(e) => setNewAssessment({...newAssessment, postural: {...newAssessment.postural, hyperkyphosis: e.target.checked}})} /> Hipercifose</label>
                      <label className="flex items-center gap-2 text-white text-sm"><input type="checkbox" className="accent-primary w-4 h-4" checked={newAssessment.postural.scoliosis} onChange={(e) => setNewAssessment({...newAssessment, postural: {...newAssessment.postural, scoliosis: e.target.checked}})} /> Escoliose</label>
                   </div>
                   <textarea placeholder="Observações posturais..." value={newAssessment.postural.observations} onChange={(e) => setNewAssessment({...newAssessment, postural: {...newAssessment.postural, observations: e.target.value}})} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white text-sm min-h-[60px]" />
                   <textarea placeholder="Desvios identificados..." value={newAssessment.postural.deviations} onChange={(e) => setNewAssessment({...newAssessment, postural: {...newAssessment.postural, deviations: e.target.value}})} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white text-sm min-h-[60px]" />
                   <textarea placeholder="Assimetrias..." value={newAssessment.postural.asymmetries} onChange={(e) => setNewAssessment({...newAssessment, postural: {...newAssessment.postural, asymmetries: e.target.value}})} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white text-sm min-h-[60px]" />
                </div>
              </details>

              <details className="bg-card-dark border border-border-dark rounded-xl group overflow-hidden">
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-purple-400">photo_library</span>
                    <span className="text-white font-bold">Evolução em Fotos</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="p-4 border-t border-border-dark grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'front', label: 'Frontal' },
                    { key: 'lateralRight', label: 'Lateral Direita' },
                    { key: 'lateralLeft', label: 'Lateral Esquerda' },
                    { key: 'back', label: 'Posterior' }
                  ].map((photo) => (
                    <div key={photo.key} className="flex flex-col gap-2">
                       <label className="text-text-secondary text-xs text-center">{photo.label}</label>
                       <div className="aspect-[3/4] bg-background-dark border border-border-dark border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
                         {newAssessment.photos[photo.key] ? (
                           <>
                             <img src={newAssessment.photos[photo.key]} alt={photo.label} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <span className="material-symbols-outlined text-white text-3xl">edit</span>
                             </div>
                           </>
                         ) : (
                           <div className="flex flex-col items-center text-text-secondary p-4 text-center">
                              <span className="material-symbols-outlined text-3xl mb-2">add_a_photo</span>
                              <span className="text-[10px]">Upload</span>
                           </div>
                         )}
                         <input 
                           type="file" 
                           accept="image/*"
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           onChange={(e) => handleFileSelect(e, photo.key as any)}
                         />
                       </div>
                    </div>
                  ))}
                  {uploadProgress > 0 && <p className="text-primary text-xs col-span-full text-center">Enviando foto: {Math.round(uploadProgress)}%</p>}
                </div>
              </details>
            </div>

            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setFlowState('new-initial')}
                className="w-1/3 h-12 bg-transparent text-text-secondary font-bold rounded-xl border border-border-dark hover:bg-white/5 transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handleSaveAssessment}
                disabled={saving}
                className="w-2/3 h-12 bg-primary text-background-dark font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Salvar Avaliação
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- STATE: HISTORY --- */}
        {flowState === 'history' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-white font-bold text-xl">Histórico Completo</h3>
               <button 
                 onClick={() => setFlowState('dashboard')}
                 className="text-primary text-sm font-bold hover:underline"
               >
                 Voltar ao Resumo
               </button>
            </div>
            {assessments.length === 0 ? (
               <div className="bg-card-dark border border-border-dark p-8 rounded-xl text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">history_toggle_off</span>
                  <p className="text-white font-medium">Nenhuma avaliação encontrada.</p>
                  <p className="text-text-secondary text-sm">Registre a primeira avaliação deste aluno.</p>
               </div>
            ) : (
               <div className="grid gap-3">
                  {assessments.map((ast, i) => (
                    <div key={ast.id} className="bg-card-dark border border-border-dark p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setSelectedAssessment(ast); setFlowState('view'); }}>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                             #{assessments.length - i}
                          </div>
                          <div>
                             <p className="text-white font-bold">{ast.createdAt?.toDate ? new Date(ast.createdAt.toDate()).toLocaleDateString() : 'Sem data'}</p>
                             <p className="text-text-secondary text-xs">{ast.weight} kg • IMC {ast.imc}</p>
                          </div>
                       </div>
                       <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
                    </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {/* --- STATE: VIEW (Read-only) --- */}
        {flowState === 'view' && selectedAssessment && (
           <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-6">
             <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-white font-bold text-xl">
                    Avaliação em {selectedAssessment.createdAt?.toDate ? new Date(selectedAssessment.createdAt.toDate()).toLocaleDateString() : ''}
                  </h3>
               </div>
               <button onClick={() => setFlowState('history')} className="text-primary text-sm font-bold hover:underline list-none">
                 Voltar Histórico
               </button>
             </div>

             <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-primary text-xs font-bold uppercase">Resumo</span>
                <span className="text-white font-bold text-lg">{selectedAssessment.weight} kg <span className="text-text-secondary">|</span> {selectedAssessment.height} m</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-primary text-xs font-bold uppercase">IMC</span>
                <span className="text-white font-bold text-xl">{selectedAssessment.imc}</span>
              </div>
            </div>

            {/* Readonly Display for components */}
            <div className="grid md:grid-cols-2 gap-4">
               {/* Photos */}
               {selectedAssessment.photos && (selectedAssessment.photos.front || selectedAssessment.photos.back) && (
                 <div className="bg-card-dark border border-border-dark p-4 rounded-xl md:col-span-2">
                   <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined text-purple-400">photo_library</span> Fotos
                   </h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {selectedAssessment.photos.front && <img src={selectedAssessment.photos.front} className="w-full aspect-[3/4] object-cover rounded-md" alt="Frente" />}
                     {selectedAssessment.photos.lateralRight && <img src={selectedAssessment.photos.lateralRight} className="w-full aspect-[3/4] object-cover rounded-md" alt="Lateral Dir" />}
                     {selectedAssessment.photos.lateralLeft && <img src={selectedAssessment.photos.lateralLeft} className="w-full aspect-[3/4] object-cover rounded-md" alt="Lateral Esq" />}
                     {selectedAssessment.photos.back && <img src={selectedAssessment.photos.back} className="w-full aspect-[3/4] object-cover rounded-md" alt="Costas" />}
                   </div>
                 </div>
               )}

               {selectedAssessment.bodyComposition && (
                 <div className="bg-card-dark border border-border-dark p-4 rounded-xl">
                   <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined text-orange-400">vital_signs</span>
                     Composição
                   </h4>
                   <div className="space-y-2">
                     <p className="flex justify-between"><span className="text-text-secondary">Gordura (%)</span> <span className="text-white font-medium">{selectedAssessment.bodyComposition.fatPercent || '-'}</span></p>
                     <p className="flex justify-between"><span className="text-text-secondary">Massa Magra</span> <span className="text-white font-medium">{selectedAssessment.bodyComposition.leanMass || '-'}</span></p>
                     <p className="flex justify-between"><span className="text-text-secondary">Massa Muscular</span> <span className="text-white font-medium">{selectedAssessment.bodyComposition.muscleMass || '-'}</span></p>
                   </div>
                 </div>
               )}

               {selectedAssessment.antropometria && (
                 <div className="bg-card-dark border border-border-dark p-4 rounded-xl">
                   <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined text-green-400">straighten</span>
                     Medidas (cm)
                   </h4>
                   <div className="space-y-2">
                     <p className="flex justify-between"><span className="text-text-secondary">Pescoço</span> <span className="text-white font-medium">{selectedAssessment.antropometria.neck || '-'}</span></p>
                     <p className="flex justify-between"><span className="text-text-secondary">Cintura</span> <span className="text-white font-medium">{selectedAssessment.antropometria.waist || '-'}</span></p>
                     <p className="flex justify-between"><span className="text-text-secondary">Abdômen</span> <span className="text-white font-medium">{selectedAssessment.antropometria.abdomen || '-'}</span></p>
                   </div>
                 </div>
               )}
            </div>
           </div>
        )}
      </div>

      <AssessmentCropperModal
        isOpen={croppingPhotoType !== null && cropperImageSrc !== ''}
        imageSrc={cropperImageSrc}
        onClose={() => { setCroppingPhotoType(null); setCropperImageSrc(''); }}
        onCrop={handleCropComplete}
      />
    </div>
  );
};
