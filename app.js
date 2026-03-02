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

            results.push({
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

        // Capture Improvement Plan data
        const planMejora = [];
        for (let i = 0; i < 8; i++) {
            if (formData[`plan_accion_${i}`]) {
                planMejora.push({
                    accion: formData[`plan_accion_${i}`],
                    dimension: formData[`plan_dimension_${i}`],
                    responsable: formData[`plan_responsable_${i}`],
                    prioridad: formData[`plan_prioridad_${i}`],
                    inicio: formData[`plan_fecha_inicio_${i}`],
                    fin: formData[`plan_fecha_fin_${i}`],
                    indicador: formData[`plan_indicador_${i}`]
                });
            }
        }

        return {
            id: Date.now().toString(36),
            timestamp: new Date().toISOString(),
            data: formData,
            results,
            totalPonderado,
            promedioGeneral,
            planMejora
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
                                    <div class="form-field">
                                        <label>Evidencia</label>
                                        <input type="text" name="ev_${dim.id}_${i}" placeholder="Link o documento">
                                    </div>
                                    <div class="form-field">
                                        <label>Hallazgos</label>
                                        <textarea name="hall_${dim.id}_${i}" placeholder="¿Qué se encontró?"></textarea>
                                    </div>
                                    <div class="form-field">
                                        <label>Recomendación</label>
                                        <textarea name="rec_${dim.id}_${i}" placeholder="Acción sugerida"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(section);
        });

        // Add Improvement Plan section
        const planSection = document.createElement('div');
        planSection.className = 'eval-section card mt-20';
        planSection.style.borderLeftColor = 'var(--accent)';
        planSection.innerHTML = `
            <div class="card-header">
                <div class="icon" style="background:rgba(245,158,11,0.1); color:var(--accent)">🚀</div>
                <h3>Plan de Mejora (Acciones Inmediatas) Opcional</h3>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%; min-width:800px; border-collapse:collapse; margin-top:1rem;">
                    <thead>
                        <tr style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">
                            <th>Acción</th><th>Dimensión</th><th>Responsable</th><th>Prioridad</th><th>Inicio</th><th>Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from({ length: 5 }).map((_, i) => `
                            <tr>
                                <td><input type="text" name="plan_accion_${i}" style="width:100%; padding:0.5rem; border:1px solid var(--border);"></td>
                                <td><input type="text" name="plan_dimension_${i}" style="width:100%; padding:0.5rem; border:1px solid var(--border);"></td>
                                <td><input type="text" name="plan_responsable_${i}" style="width:100%; padding:0.5rem; border:1px solid var(--border);"></td>
                                <td>
                                    <select name="plan_prioridad_${i}" style="width:100%; padding:0.5rem; border:1px solid var(--border);">
                                        <option value="Alta">Alta</option>
                                        <option value="Media">Media</option>
                                        <option value="Baja">Baja</option>
                                    </select>
                                </td>
                                <td><input type="date" name="plan_fecha_inicio_${i}" style="width:100%; padding:0.5rem; border:1px solid var(--border);"></td>
                                <td><input type="date" name="plan_fecha_fin_${i}" style="width:100%; padding:0.5rem; border:1px solid var(--border);"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(planSection);
    }
}

const engine = new EvalEngine();
