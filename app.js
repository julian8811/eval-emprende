/**
 * EvalEmprende Core Engine
 * Handles evaluation logic, data persistence and UI interactions.
 */

const DIMENSIONES = [
    {
        id: "propuesta_valor",
        nombre: "Propuesta de valor e innovación",
        peso: 15,
        criterios: [
            "Claridad del problema / oportunidad y público objetivo",
            "Diferenciación (beneficios, atributos, evidencia)",
            "Nivel de innovación (producto, proceso, modelo)",
            "Alineación con área (conocimiento / sostenimiento) y pertinencia territorial",
        ],
    },
    {
        id: "mercado_cliente",
        nombre: "Mercado y cliente",
        peso: 15,
        criterios: [
            "Segmentación, tamaño de mercado y nicho",
            "Validación (entrevistas, pilotos, ventas, métricas)",
            "Competencia y posicionamiento",
            "Estrategia de precios y disposición a pagar",
            "Fuentes de ingreso y captura de valor",
            "Estructura de costos y margen",
            "Canales y aliados clave",
            "Plan financiero básico (flujo de caja, punto de equilibrio)",
        ],
    },
    {
        id: "operacion",
        nombre: "Operación / producción / prestación",
        peso: 20,
        criterios: [
            "Proceso estandarizado (pasos, tiempos, responsables)",
            "Capacidad instalada, recursos y cuellos de botella",
            "Calidad y control (pruebas, fichas, SOP, garantías)",
            "Proveedores, inventarios y logística (si aplica)",
            "Tiempos de entrega / niveles de servicio (SLA) y postventa",
        ],
    },
    {
        id: "diseno_experiencia",
        nombre: "Diseño y experiencia",
        peso: 10,
        criterios: [
            "Diseño y presentación (producto) o experiencia (servicio)",
            "Usabilidad y experiencia de usuario (si digital)",
            "Documentación: instructivos, manuales, política de cambios",
            "Requisitos técnicos / sanitarios / rotulado según normativa aplicable",
        ],
    },
    {
        id: "comercializacion",
        nombre: "Comercialización y marketing",
        peso: 15,
        criterios: [
            "Marca: identidad, coherencia, recordación",
            "Estrategia digital (redes, contenido, SEO/SEM si aplica)",
            "Estrategia de ventas (funnel, guion, CRM, metas)",
            "Material comercial (catálogo, portafolio, pitch, casos)",
        ],
    },
    {
        id: "sostenibilidad",
        nombre: "Sostenibilidad y sostenimiento",
        peso: 5,
        criterios: [
            "Impacto ambiental (insumos, residuos, circularidad)",
            "Impacto social (empleo, enfoque diferencial, comunidad)",
            "Plan de sostenimiento: mantenimiento, continuidad, resiliencia",
        ],
    },
    {
        id: "legal_riesgos",
        nombre: "Legal y riesgos",
        peso: 5,
        criterios: [
            "Formalización y cumplimiento básico (tributario / contractual)",
            "Propiedad intelectual (marca, derechos, secretos) y uso de datos",
            "Riesgos principales y plan de mitigación (operativos / financieros)",
        ],
    },
];

class EvalEngine {
    constructor() {
        this.currentEval = this.loadCurrent() || {};
        this.history = this.loadHistory() || [];
    }

    saveCurrent(data) {
        this.currentEval = { ...this.currentEval, ...data };
        localStorage.setItem('eval_emprende_current', JSON.stringify(this.currentEval));
    }

    loadCurrent() {
        const stored = localStorage.getItem('eval_emprende_current');
        return stored ? JSON.parse(stored) : null;
    }

    saveToHistory(result) {
        this.history.unshift(result);
        localStorage.setItem('eval_emprende_history', JSON.stringify(this.history));
        localStorage.setItem('eval_emprende_latest', JSON.stringify(result));
        localStorage.removeItem('eval_emprende_current');
    }

    loadHistory() {
        const stored = localStorage.getItem('eval_emprende_history');
        return stored ? JSON.parse(stored) : [];
    }

    calculate(formData) {
        const results = [];
        let totalPonderado = 0;
        let sumaPesos = 0;

        DIMENSIONES.forEach(dim => {
            const scores = [];
            dim.criterios.forEach((_, i) => {
                const val = formData[`cal_${dim.id}_${i}`];
                if (val) scores.push(parseInt(val));
            });

            const promedio = scores.length > 0 ?
                Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
            const ponderado = Math.round((promedio * dim.peso / 100) * 100) / 100;

            let prioridad = "Alta";
            if (promedio >= 4) prioridad = "Baja";
            else if (promedio >= 3) prioridad = "Media";

            results.append({
                id: dim.id,
                nombre: dim.nombre,
                peso: dim.peso,
                promedio,
                ponderado,
                prioridad,
                scores
            });

            totalPonderado += ponderado;
            sumaPesos += (promedio * dim.peso);
        });

        const promedioGeneral = Math.round((sumaPesos / 100) * 100) / 100;

        return {
            id: Date.now().toString(36),
            timestamp: new Date().toISOString(),
            data: formData,
            results,
            totalPonderado,
            promedioGeneral
        };
    }

    // UI Helpers
    initEvaluationForm() {
        const container = document.getElementById('dimensions-container');
        if (!container) return;

        DIMENSIONES.forEach((dim, idx) => {
            const section = document.createElement('div');
            section.className = 'eval-section card mt-20';
            section.innerHTML = `
                <div class="card-header">
                    <div class="icon" style="background:rgba(13,148,136,0.1); color:var(--primary)">${idx + 1}</div>
                    <h3>${dim.nombre} (${dim.peso}%)</h3>
                </div>
                <div class="criteria-list">
                    ${dim.criterios.map((c, i) => `
                        <div class="criterion-item">
                            <label class="criterion-label">${c}</label>
                            <div class="criterion-inputs">
                                <div class="rating-group">
                                    ${[1, 2, 3, 4, 5].map(v => `
                                        <label class="rating-box">
                                            <input type="radio" name="cal_${dim.id}_${i}" value="${v}" required>
                                            <span>${v}</span>
                                        </label>
                                    `).join('')}
                                </div>
                                <div class="extra-inputs">
                                    <input type="text" name="ev_${dim.id}_${i}" placeholder="Evidencia (link/doc)">
                                    <textarea name="hall_${dim.id}_${i}" placeholder="Hallazgos"></textarea>
                                    <textarea name="rec_${dim.id}_${i}" placeholder="Recomendaciones"></textarea>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(section);
        });
    }
}

const engine = new EvalEngine();
