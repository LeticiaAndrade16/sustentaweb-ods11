
(function () {
  // Keys para localStorage
  const LS = {
    visits: 'sustentaweb_visits',
    quizResults: 'sustentaweb_quiz_results'
  };

  // Incrementa visitas locais
  function incrementVisits() {
    const now = new Date().toISOString();
    const visits = JSON.parse(localStorage.getItem(LS.visits) || '[]');
    visits.push({ ts: now });
    localStorage.setItem(LS.visits, JSON.stringify(visits));
  }

  // On load
  document.addEventListener('DOMContentLoaded', () => {
    incrementVisits();

    // Formulário de quiz
    const quizForm = document.getElementById('quizForm');
    const quizResult = document.getElementById('quizResult');
    quizForm.addEventListener('submit', handleQuizSubmit);

    // Contact form: abre mailto com conteúdo preenchido
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', handleContactSubmit);

    // Exportar CSV
    const exportBtn = document.getElementById('exportStats');
    exportBtn.addEventListener('click', exportCSV);
  });

  // Respostas corretas (modelo educacional)
  const correctAnswers = {
    q1: 'reciclavel',    // embalagem de iogurte vazia
    q2: 'ponto',         // pilhas e baterias -> pontos de coleta
    q3: 'reciclavel',    // vidro quebrado embalado pode ir ao reciclável (ou ponto especial) -> consideramos reciclável
    q4: 'lixo',          // embalagem suja de gordura -> lixo comum (ou orgânico) dependendo do contexto; aqui usamos lixo comum
    q5: 'reciclavel'     // tampas plásticas: separar e reciclar quando possível
  };

  function handleQuizSubmit(ev) {
    ev.preventDefault();
    const form = ev.target;
    const data = new FormData(form);
    const answers = {};
    for (const [k, v] of data.entries()) {
      answers[k] = v;
    }

    // cálculo simples de acertos
    let score = 0;
    Object.keys(correctAnswers).forEach((k) => {
      if (answers[k] === correctAnswers[k]) score += 1;
    });

    const percent = Math.round((score / Object.keys(correctAnswers).length) * 100);

    // Salva resultado no localStorage
    const saved = JSON.parse(localStorage.getItem(LS.quizResults) || '[]');
    const entry = {
      ts: new Date().toISOString(),
      answers,
      score,
      percent
    };
    saved.push(entry);
    localStorage.setItem(LS.quizResults, JSON.stringify(saved));

    // Mostrar resultado amigável
    const resultEl = document.getElementById('quizResult');
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <h4>Resultado: ${score}/${Object.keys(correctAnswers).length} (${percent}%)</h4>
      <p>${percent >= 80 ? 'Excelente! Você está bem informado.' :
               percent >= 50 ? 'Bom, mas dá para melhorar.' :
               'Ótima oportunidade para aprender mais.'}</p>
      <details>
        <summary>Respostas corretas</summary>
        <ul>
          <li>1 — Reciclável</li>
          <li>2 — Em pontos de coleta específicos</li>
          <li>3 — Reciclável (tomando cuidado)</li>
          <li>4 — Lixo comum (caixa de pizza muito engordurada)</li>
          <li>5 — Separar e reciclar quando possível</li>
        </ul>
      </details>
    `;

    // rolagem suave para resultado
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleContactSubmit(ev) {
    ev.preventDefault();
    const data = new FormData(ev.target);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const message = data.get('message') || '';
    // Prepara mailto como fallback (abre cliente de e-mail)
    const subject = encodeURIComponent('Contato via SustentaWeb');
    const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`);
    window.location.href = `mailto:contato@sustentaweb.org.br?subject=${subject}&body=${body}`;
  }

  // Exporta estatísticas (visitas + quiz) como CSV
  function exportCSV() {
    const visits = JSON.parse(localStorage.getItem(LS.visits) || '[]');
    const quizzes = JSON.parse(localStorage.getItem(LS.quizResults) || '[]');

    // Monta CSV simples
    let csv = 'tipo,ts,score,percent,answers_json\n';
    quizzes.forEach(q => {
      csv += `quiz,${q.ts},${q.score},${q.percent},"${escapeCSV(JSON.stringify(q.answers))}"\n`;
    });
    visits.forEach(v => {
      csv += `visit,${v.ts},,,\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sustentaweb_stats.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeCSV(str) {
    return str.replace(/"/g, '""');
  }

})();
