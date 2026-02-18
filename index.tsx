
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Declare XLSX for TypeScript context
declare const XLSX: any;

// --- CONFIGURACIÓN Y CONSTANTES DEL PROCESADOR (Mantenidas) ---
const COLUMN_MAPPING: Record<string, string> = {
  'TEXTO_1': 'Titular del mail',
  'TEXTO_2': 'Texto fecha',
  'TEXTO_3': 'Texto fecha',
  'TEXTO_4': 'Texto largo Woman',
  'TEXTO_5': 'Texto largo Man',
  'TEXTO_6': 'Texto largo Kids → Girl',
  'TEXTO_7': 'Texto largo Boy',
  'TEXTO_8': 'Texto largo Baby → Baby Girl',
  'TEXTO_9': 'Texto largo Baby Boy',
  'TEXTO_10': 'Texto largo Teen → Teen Girl',
  'TEXTO_11': 'Texto largo Teen Boy',
  'TEXTO_13': 'Módulo 1: CTA 1',
  'TEXTO_14': 'Módulo 1: CTA 2',
  'TEXTO_18': 'Módulo 2: CTA 1',
  'TEXTO_19': 'Módulo 2: CTA 2',
  'TEXTO_20': 'CTA Home',
  'TEXTO_22': 'Módulo 3: CTA 1',
  'TEXTO_23': 'Módulo 3: CTA 2',
  'COD_IDIOMA_COMUNICACION': 'IDIOMA',
  'Cod_idioma': 'IDIOMA',
  'COD_IDIOMA': 'IDIOMA',
  'COD_UNIFICADA': 'UNIFICADA',
  'ASUNTO': 'ASUNTO',
  'ASUNTO_2': 'ASUNTO_2',
  'SUBASUNTO': 'SUBASUNTO',
  'SUBASUNTO_2': 'SUBASUNTO_2',
  'TEXTO_LEGAL_1': 'TEXTO_LEGAL',
  'TEXTO_LEGAL_2': 'TEXTO_LEGAL_2',
  'TEXTO_LEGAL_3': 'TEXTO_LEGAL_3',
  'ID_PAIS': 'ID',
  'PAIS': 'PAÍS',
  'PAIS_NAME': 'PAÍS',
  'ID': 'ID'
};

const firstNonEmpty = (values: any[]) => {
  for (const v of values) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return v;
  }
  return '';
};

const groupBy = (arr: any[], keys: string[]) => {
  const map = new Map<string, any[]>();
  for (const row of arr) {
    const resolvedKeys = keys.map(k => {
      const foundKey = Object.keys(row).find(rk => rk.trim().toUpperCase() === k.toUpperCase());
      return foundKey ? (row[foundKey] ?? '') : '';
    });
    const key = resolvedKeys.join('||');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
};

const localizarFilaCabecera = (aoa: any[][]) => {
  for (let i = 0; i < aoa.length; i++) {
    const row = (aoa[i] || []).map(v => String(v).trim().toUpperCase());
    if (row.includes('ID') && (row.includes('PAÍS') || row.includes('PAIS')) && row.includes('IDIOMA')) {
      return i;
    }
  }
  return 0;
};

const aoaToObjects = (aoa: any[][], headerIdx: number) => {
  const header = (aoa[headerIdx] || []).map(v => String(v).trim());
  const rows = aoa.slice(headerIdx + 1);
  const data = [];
  for (const r of rows) {
    if (!r || r.every(c => c === '' || c === null || c === undefined)) continue;
    const obj: any = {};
    header.forEach((h, idx) => { 
      if (h) obj[h] = (r[idx] ?? '').toString().trim(); 
    });
    data.push(obj);
  }
  return data;
};

// --- COMPONENTE: TRADUCCIONES OUTLET ---
const TraduccionesOutletView: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [masterAuxFile, setMasterAuxFile] = useState<File | null>(null);
  const [sheetType, setSheetType] = useState('Inicio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'original' | 'master' | 'masterAux') => {
    const file = e.target.files?.[0] || null;
    if (type === 'original') setOriginalFile(file);
    else if (type === 'master') setMasterFile(file);
    else if (type === 'masterAux') setMasterAuxFile(file);
    setError(null);
    setSuccess(false);
  };

  const processExcels = async (format: 'xlsx' | 'raw') => {
    if (!originalFile || (!masterFile && !masterAuxFile)) {
      setError("Sube el Excel Original y al menos un Master.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const readAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      };

      const originalBuffer = await readAsArrayBuffer(originalFile);
      const originalWorkbook = XLSX.read(originalBuffer, { type: 'array' });
      const originalSheetName = originalWorkbook.SheetNames.find((name: string) => 
        name.toUpperCase().includes(sheetType.toUpperCase())
      );
      
      if (!originalSheetName) throw new Error(`Pestaña "${sheetType}" no encontrada.`);

      const originalSheet = originalWorkbook.Sheets[originalSheetName];
      const originalAOA: any[][] = XLSX.utils.sheet_to_json(originalSheet, { header: 1, defval: '' });
      const headerIdx = localizarFilaCabecera(originalAOA);
      const df = aoaToObjects(originalAOA, headerIdx);

      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const cleanSheetName = originalSheetName.replace(/[\[\]\*\?\/\\]/g, '').substring(0, 31);

      if (masterFile) {
        const masterBuffer = await readAsArrayBuffer(masterFile);
        const masterWorkbook = XLSX.read(masterBuffer, { type: 'array' });
        const masterSheet = masterWorkbook.Sheets[masterWorkbook.SheetNames[0]];
        const mRowsRaw: any[][] = XLSX.utils.sheet_to_json(masterSheet, { header: 1 });
        const mHeaders = (mRowsRaw[0] || []).filter(h => h).map(h => String(h).trim());
        
        const translationsData = [];
        const byGroup = groupBy(df, ['IDIOMA', 'UNIFICADA']);
        for (const [, group] of byGroup.entries()) {
          const newRow: Record<string, any> = {};
          mHeaders.forEach(header => {
            const findValue = (col: string) => {
              const actualKey = Object.keys(group[0] || {}).find(k => k.trim().toUpperCase() === col.toUpperCase());
              return actualKey ? firstNonEmpty(group.map(r => r[actualKey])) : '';
            };
            const mapped = COLUMN_MAPPING[header];
            let val = mapped ? findValue(mapped) : '';
            if (!val) val = findValue(header);
            newRow[header] = val;
          });
          translationsData.push(newRow);
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(translationsData, { header: mHeaders }), cleanSheetName);
        XLSX.writeFile(wb, `${dateStr}_Outlet_${cleanSheetName}_Translations.${format === 'xlsx' ? 'xlsx' : 'txt'}`, format === 'raw' ? { bookType: 'txt' } : undefined);
      }

      if (masterAuxFile) {
        const masterAuxBuffer = await readAsArrayBuffer(masterAuxFile);
        const masterAuxWorkbook = XLSX.read(masterAuxBuffer, { type: 'array' });
        const masterAuxSheet = masterAuxWorkbook.Sheets[masterAuxWorkbook.SheetNames[0]];
        const mRowsRaw: any[][] = XLSX.utils.sheet_to_json(masterAuxSheet, { header: 1 });
        const mHeaders = (mRowsRaw[0] || []).filter(h => h).map(h => String(h).trim());
        
        const auxiliarData = df.map(row => {
          const newRow: Record<string, any> = {};
          mHeaders.forEach(header => {
            const findVal = (col: string) => {
              const k = Object.keys(row).find(rk => rk.trim().toUpperCase() === col.toUpperCase());
              return k ? row[k] : '';
            };
            if (header === 'COD_PAIS') return newRow[header] = findVal('ID');
            if (header === 'COD_IDIOMA_IMAGEN') return newRow[header] = findVal('UNIFICADA');
            const mapped = COLUMN_MAPPING[header];
            let val = mapped ? findVal(mapped) : '';
            if (!val) val = findVal(header);
            newRow[header] = val;
          });
          return newRow;
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auxiliarData, { header: mHeaders }), cleanSheetName);
        XLSX.writeFile(wb, `${dateStr}_Outlet_${cleanSheetName}_Auxiliar.${format === 'xlsx' ? 'xlsx' : 'csv'}`, format === 'raw' ? { bookType: 'csv', FS: ';' } : undefined);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        {/* Header Card Area */}
        <div className="bg-[#232a42] p-12 text-white flex items-start gap-8 relative overflow-hidden">
          <div className="bg-[#4ade80] w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg relative z-10">
            <i className="fas fa-file-invoice"></i>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-3 tracking-tight">Marketing Automation</h2>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium">
              Sistema centralizado para el procesamiento inteligente de catálogos retail. Genera simultáneamente archivos de Traducciones y Auxiliares.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </div>

        {/* Content Area */}
        <div className="p-12 space-y-12 bg-white">
          {/* Paso 1: Dropdown */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PASO 1: SELECCIONAR PESTAÑA DE ORIGEN</label>
            <div className="relative group">
              <select 
                value={sheetType} 
                onChange={e => setSheetType(e.target.value)} 
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-[1.25rem] px-8 py-5 appearance-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
              >
                <option value="Inicio">Inicio</option>
                <option value="UD">UD</option>
                <option value="UH">UH</option>
              </select>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>

          {/* Pasos 2-4: Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PASO 2: EXCEL ORIGINAL</label>
              <div onClick={() => document.getElementById('up-orig')?.click()} className={`group border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-5 transition-all cursor-pointer hover:bg-slate-50 ${originalFile ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
                <div className={`text-4xl ${originalFile ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'} transition-colors`}><i className="fas fa-cloud-arrow-up"></i></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center max-w-[150px] truncate leading-relaxed">{originalFile ? originalFile.name : 'SUBIR TRADUCCIONES'}</span>
                <input type="file" id="up-orig" className="hidden" accept=".xlsx,.xls" onChange={e => handleFileUpload(e, 'original')} />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PASO 3: MASTER TRADUCCIONES</label>
              <div onClick={() => document.getElementById('up-trans')?.click()} className={`group border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-5 transition-all cursor-pointer hover:bg-slate-50 ${masterFile ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
                <div className={`text-4xl ${masterFile ? 'text-indigo-500' : 'text-slate-300 group-hover:text-indigo-400'} transition-colors`}><i className="fas fa-file-lines"></i></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center max-w-[150px] truncate leading-relaxed">{masterFile ? masterFile.name : 'SUBIR MASTER TRANS'}</span>
                <input type="file" id="up-trans" className="hidden" accept=".xlsx,.xls" onChange={e => handleFileUpload(e, 'master')} />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PASO 4: MASTER AUXILIAR</label>
              <div onClick={() => document.getElementById('up-aux')?.click()} className={`group border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-5 transition-all cursor-pointer hover:bg-slate-50 ${masterAuxFile ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
                <div className={`text-4xl ${masterAuxFile ? 'text-amber-500' : 'text-slate-300 group-hover:text-indigo-400'} transition-colors`}><i className="fas fa-clipboard-check"></i></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center max-w-[150px] truncate leading-relaxed">{masterAuxFile ? masterAuxFile.name : 'SUBIR MASTER AUX'}</span>
                <input type="file" id="up-aux" className="hidden" accept=".xlsx,.xls" onChange={e => handleFileUpload(e, 'masterAux')} />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6 pt-6">
            <button onClick={() => processExcels('xlsx')} disabled={isProcessing || !originalFile} className="bg-[#dce4f2] text-[#5c6d8a] font-black px-12 py-5 rounded-[1.25rem] flex items-center justify-center gap-4 hover:bg-[#cfd9ea] transition-all disabled:opacity-50 text-xs tracking-widest uppercase shadow-sm">
              {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-excel text-lg"></i>}
              DESCARGAR EXCEL (XLSX)
            </button>
            <button onClick={() => processExcels('raw')} disabled={isProcessing || !originalFile} className="bg-[#dce4f2] text-[#5c6d8a] font-black px-12 py-5 rounded-[1.25rem] flex items-center justify-center gap-4 hover:bg-[#cfd9ea] transition-all disabled:opacity-50 text-xs tracking-widest uppercase shadow-sm">
              {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-code text-lg"></i>}
              DESCARGAR TEXTO/CSV
            </button>
          </div>

          <div className="flex justify-center gap-16 text-[10px] font-black uppercase tracking-[0.2em] pt-4">
            <div className="flex items-center gap-3 text-emerald-500"><i className="fas fa-circle-check text-sm"></i> SEGURIDAD DE DATOS</div>
            <div className="flex items-center gap-3 text-indigo-500"><i className="fas fa-bolt text-sm"></i> GENERACIÓN FLEXIBLE</div>
          </div>

          {error && <div className="bg-rose-50 text-rose-700 p-5 rounded-2xl text-xs font-bold border border-rose-100 animate-in fade-in"><i className="fas fa-triangle-exclamation mr-3"></i>{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl text-xs font-bold border border-emerald-100 animate-in fade-in"><i className="fas fa-circle-check mr-3"></i>¡Archivos generados con éxito!</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-slate-100">
            <div className="flex items-start gap-5 group">
              <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 shadow-sm"><i className="fas fa-layer-group"></i></div>
              <div><h4 className="font-bold text-slate-800 text-sm mb-1">Agrupamiento Inteligente</h4><p className="text-slate-500 text-[11px] leading-relaxed font-medium">Agrupación por Idioma y Unificada para catálogos optimizados.</p></div>
            </div>
            <div className="flex items-start gap-5 group">
              <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0 shadow-sm"><i className="fas fa-file-export"></i></div>
              <div><h4 className="font-bold text-slate-800 text-sm mb-1">Doble Exportación</h4><p className="text-slate-500 text-[11px] leading-relaxed font-medium">Procesamiento paralelo que genera archivos de traducción y auxiliares.</p></div>
            </div>
            <div className="flex items-start gap-5 group">
              <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-sm"><i className="fas fa-shuffle"></i></div>
              <div><h4 className="font-bold text-slate-800 text-sm mb-1">Mapeo Universal</h4><p className="text-slate-500 text-[11px] leading-relaxed font-medium">Mapeo dinámico de cabeceras configurable según el país de destino.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: FORMATEADOR DE CÓDIGOS DE PAÍS ---
const CountryCodeFormatterView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [excludeText, setExcludeText] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalize = (text: string) => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const handleGenerate = () => {
    setError(null);
    setResult('');
    
    // 1. Limpieza inicial de líneas
    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l !== '');

    if (lines.length === 0) {
      setError("No hay datos pegados para procesar.");
      return;
    }

    try {
      // 2. Obtener lista de exclusión manual
      const manualExcludes = excludeText.split(/,|\n/)
        .map(p => normalize(p))
        .filter(p => p !== '');

      const codes: string[] = [];
      let isExcludedByWeek = false; // Flag para exclusión automática por marcador de semanas
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // A. DETECCIÓN DE MARCADORES DE SEMANAS (Exclusión Automática)
        // Patrón: Número (1, 2 o 3) seguido de una línea que contenga "SEMANA" y "TARDE"
        const isPotentialWeekNumber = /^[123]$/.test(line);
        if (isPotentialWeekNumber && lines[i + 1]) {
          const nextLine = normalize(lines[i + 1]);
          if (nextLine.includes("semana") && nextLine.includes("tarde")) {
            isExcludedByWeek = true;
            i += 2; // Saltar el bloque del marcador
            continue;
          }
        }

        // B. DETECCIÓN DE BLOQUE DE PAÍS (Código -> Nombre(s) -> ok)
        // Un bloque válido comienza siempre por una línea puramente numérica
        if (/^\d+$/.test(line)) {
          const countryCode = line;
          const nameParts: string[] = [];
          i++;

          // Recopilamos todas las líneas de texto hasta encontrar el marcador de cierre "ok"
          // Esto permite nombres de países que ocupan varias líneas (ej. "COREA \n DEL SUR")
          while (i < lines.length && normalize(lines[i]) !== "ok") {
            nameParts.push(lines[i]);
            i++;
          }

          const countryName = nameParts.join(" ").trim();
          
          // Solo procesamos si no estamos bajo el efecto de un marcador de semanas
          if (!isExcludedByWeek) {
            // Aplicamos exclusión manual del textarea
            if (countryName && !manualExcludes.includes(normalize(countryName))) {
              // Formateo obligatorio a 3 cifras
              codes.push(countryCode.padStart(3, '0'));
            }
          }

          i++; // Saltamos la línea del "ok"
          continue;
        }

        i++; // Avanzamos si la línea no encaja con ningún patrón conocido
      }

      if (codes.length === 0) {
        setError("No se detectaron códigos válidos o todo fue excluido.");
        return;
      }

      // 3. Generar resultado unificado
      setResult(codes.join(','));
    } catch (err) {
      setError("Error procesando el listado. Revisa el formato de los datos.");
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-[#232a42] p-12 text-white flex items-start gap-8 relative overflow-hidden">
          <div className="bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg relative z-10">
            <i className="fas fa-globe"></i>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-3 tracking-tight">Formateador de Códigos</h2>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium">
              Transforma listados de países en códigos numéricos unificados de 3 cifras separados por comas.
            </p>
          </div>
        </div>

        <div className="p-12 space-y-10 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Input Principal */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">📝 1. PEGAR LISTADO DE PAÍSES</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ejemplo:\n474\nARUBA\nok\n800\nAUSTRALIA\nok`}
                className="w-full h-64 bg-[#f8fafc] border border-slate-200 rounded-[1.25rem] p-6 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
              />
            </div>

            {/* Exclusiones */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">🚫 2. PAÍSES A EXCLUIR</label>
              <textarea
                value={excludeText}
                onChange={(e) => setExcludeText(e.target.value)}
                placeholder="Escribe los países a excluir separados por coma o salto de línea"
                className="w-full h-64 bg-[#f8fafc] border border-slate-200 rounded-[1.25rem] p-6 font-medium text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 pt-4">
            <button
              onClick={handleGenerate}
              className="bg-[#232a42] text-white font-black px-16 py-5 rounded-[1.25rem] flex items-center justify-center gap-4 hover:bg-slate-800 transition-all text-xs tracking-[0.2em] uppercase shadow-xl hover:-translate-y-1 active:translate-y-0"
            >
              <i className="fas fa-bolt text-indigo-400"></i>
              Generar Códigos
            </button>

            {error && (
              <div className="bg-rose-50 text-rose-700 px-6 py-4 rounded-2xl text-xs font-bold border border-rose-100 animate-in slide-in-from-top-2">
                <i className="fas fa-triangle-exclamation mr-3"></i>{error}
              </div>
            )}

            {result && (
              <div className="w-full space-y-4 animate-in zoom-in-95">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center block">📦 3. RESULTADO GENERADO</label>
                <div className="relative group">
                  <div className="w-full bg-slate-900 text-emerald-400 p-8 rounded-[1.5rem] font-mono text-lg break-all shadow-inner border border-slate-800">
                    {result}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`absolute right-4 top-4 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'}`}
                  >
                    {copied ? <><i className="fas fa-check mr-2"></i>Copiado</> : <><i className="fas fa-copy mr-2"></i>Copiar</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: HOME (CON ACCESOS DIRECTOS) ---
const HomeView = ({ onNavigate }: { onNavigate: (id: string) => void }) => (
  <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="relative bg-[#232a42] rounded-[3rem] p-16 text-white overflow-hidden shadow-2xl">
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-5xl font-black mb-8 leading-tight tracking-tight">MANGO Mejoras <span className="text-indigo-400 text-6xl">.</span></h1>
        <p className="text-slate-400 text-xl leading-relaxed font-medium">
          Bienvenido al hub de automatización.
        </p>
        <div className="mt-12 flex gap-6">
          <div className="bg-white/5 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-[0.2em] shadow-lg">
            <i className="fas fa-bolt text-indigo-400 mr-3"></i> Eficiencia Operativa
          </div>
          <div className="bg-white/5 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-[0.2em] shadow-lg">
            <i className="fas fa-shield-check text-emerald-400 mr-3"></i> Calidad de Datos
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
    </div>

    {/* Sección de Acceso Rápido */}
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Acceso Rápido</h2>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Herramientas principales</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div 
          onClick={() => onNavigate('traducciones')}
          className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 cursor-pointer hover:border-indigo-100"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg bg-indigo-500 group-hover:scale-110 transition-transform">
            <i className="fas fa-folder-open text-2xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Traducciones Outlet</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">Procesamiento inteligente de catálogos y generación de archivos auxiliares.</p>
          <div className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
            Ir a herramienta <i className="fas fa-arrow-right group-hover:translate-x-3 transition-transform"></i>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('countryCodes')}
          className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 cursor-pointer hover:border-indigo-100"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg bg-[#232a42] group-hover:scale-110 transition-transform">
            <i className="fas fa-globe text-2xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Formateador de Países</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">Extrae y unifica códigos numéricos de países a formato de 3 cifras.</p>
          <div className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
            Ir a herramienta <i className="fas fa-arrow-right group-hover:translate-x-3 transition-transform"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTE: LISTA DE HERRAMIENTAS ---
const AutomationsList = ({ onSelect }: { onSelect: (tab: string) => void }) => {
  const tools = [
    { id: 'traducciones', title: 'Traducciones Outlet', desc: 'Unificación de Excels de traducciones y generación automática de archivos auxiliares.', icon: 'fa-language', color: 'bg-indigo-500', active: true },
    { id: 'countryCodes', title: 'Formateador de Países', desc: 'Herramienta para filtrar y formatear códigos de país a 3 cifras para bases de datos.', icon: 'fa-globe', color: 'bg-[#232a42]', active: true },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Herramientas</h2>
          <p className="text-slate-500 font-medium">Ejecuta las automatizaciones disponibles.</p>
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase bg-white border border-slate-200 px-6 py-3 rounded-full tracking-[0.2em] shadow-sm">
          {tools.length} Módulo Activo
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            onClick={() => tool.active && onSelect(tool.id)}
            className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 cursor-pointer hover:border-indigo-100"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg ${tool.color} group-hover:scale-110 transition-transform`}>
              <i className={`fas ${tool.icon} text-2xl`}></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{tool.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">{tool.desc}</p>
            <div className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
              Ejecutar <i className="fas fa-arrow-right group-hover:translate-x-3 transition-transform"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView onNavigate={setActiveTab} />;
      case 'automations': return <AutomationsList onSelect={setActiveTab} />;
      case 'traducciones': return <TraduccionesOutletView />;
      case 'countryCodes': return <CountryCodeFormatterView />;
      default: return <HomeView onNavigate={setActiveTab} />;
    }
  };

  const NavItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${activeTab === id ? 'bg-[#232a42] text-white shadow-xl shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <i className={`fas ${icon} text-lg w-6`}></i>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <aside className="w-80 bg-white border-r border-slate-200 px-8 py-10 flex flex-col fixed h-full z-20 overflow-y-auto">
        <div className="flex items-center gap-5 mb-16 px-2">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg">M</div>
          <div>
            <span className="font-black text-xl tracking-tighter block leading-none">MANGO</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">MARKETING TECH</span>
          </div>
        </div>
        <nav className="space-y-3 flex-1">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6 px-4">AUTOMATIZACIONES</div>
          <NavItem id="home" icon="fa-house" label="Home" />
          <NavItem id="traducciones" icon="fa-folder-open" label="Traducciones Outlet" />
          <NavItem id="countryCodes" icon="fa-globe" label="Formateador Países" />
        </nav>
        <div className="mt-auto">
          <div className="bg-[#f8fafc] rounded-3xl p-6 border border-slate-100 shadow-sm">
             <div className="space-y-3">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Estatus del Sistema</p>
               <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[11px] font-bold text-slate-600">Todos los servicios activos</span>
               </div>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-16">
        <header className="flex justify-between items-center mb-16">
           <div className="flex items-center gap-4">
             <div className="bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-md tracking-tighter shadow-sm">V2.5</div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MARKETING TECH DASHBOARD</div>
           </div>
           <div className="flex items-center gap-8">
             <div className="flex items-center gap-4 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 shadow-sm overflow-hidden"><div className="w-full h-full flex items-center justify-center text-white text-[9px] font-black">JS</div></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 shadow-sm overflow-hidden"><div className="w-full h-full flex items-center justify-center text-white text-[9px] font-black">AO</div></div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">MARKETING OPS</span>
             </div>
             <div className="flex gap-4">
               <button className="w-11 h-11 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm hover:shadow-md"><i className="fas fa-bell"></i></button>
               <button className="w-11 h-11 bg-slate-900 rounded-2xl text-white shadow-lg flex items-center justify-center overflow-hidden"><i className="fas fa-user-circle text-2xl"></i></button>
             </div>
           </div>
        </header>

        {renderContent()}

        <footer className="mt-24 py-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] gap-8">
          <div className="flex items-center gap-8">
            <span className="tracking-tighter">© {new Date().getFullYear()} MANGO MARKETING AUTOMATION</span>
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
            <span>PROYECTO INTERNO</span>
          </div>
          <div className="flex gap-10">
            <a href="#" className="hover:text-indigo-600 transition-all">Documentación</a>
            <a href="#" className="hover:text-indigo-600 transition-all">Soporte</a>
            <a href="#" className="hover:text-indigo-600 transition-all">Reportar Bug</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
