// 各気温のトップス2種 × 靴2種を、40通りの完成画像に対応づける。
// 画像を事前一括読込せず、選択した組み合わせだけを読み込む。
(() => {
  const editor = document.getElementById('outfit-editor');
  if (!editor) return;
  const catalog = window.OutfitWardrobe;
  const $ = id => document.getElementById(id);
  const tierSelect = $('editor-tier');
  const image = $('editor-image');
  const preview = editor.querySelector('.editor-preview');
  const caption = $('editor-caption');
  const status = $('editor-status');
  const weatherButton = $('use-weather-outfit');
  const retryButton = $('retry-outfit');
  let selection = { tierId: catalog.forecastTierId || 'tier06', top: 0, shoes: 0 };
  let shown = null;
  let revision = 0;
  let edited = false;
  let retrySelection = null;

  catalog.tiers.forEach(tier => tierSelect.add(new Option(tier.range + ' · ' + tier.title, tier.id)));

  function choose(next) {
    selection = { ...next };
    const tier = catalog.getTier(next.tierId);
    tierSelect.value = next.tierId;
    [0,1].forEach(index => {
      editor.querySelector('[data-top-label="' + index + '"]').textContent = tier.topLabels[index];
      editor.querySelector('[data-shoe-label="' + index + '"]').textContent = tier.shoeLabels[index];
    });
    editor.querySelector('input[name="editor-top"][value="' + next.top + '"]').checked = true;
    editor.querySelector('input[name="editor-shoes"][value="' + next.shoes + '"]').checked = true;
  }

  function forecastNote() {
    weatherButton.disabled = !catalog.forecastTierId;
    $('editor-tier-note').textContent = catalog.forecastTierId
      ? '予報の目安：' + catalog.getTier(catalog.forecastTierId).range + '。気温を変えるとその段階の基本コーデになります。'
      : '予報の取得前は17〜20°C未満のコーデを表示します。気温を変えるとその段階の基本コーデになります。';
  }

  function render() {
    const selected = { ...selection };
    const tier = catalog.getTier(selected.tierId);
    const source = catalog.imagePath(selected.tierId, selected.top, selected.shoes);
    const label = tier.range + ' · ' + tier.topLabels[selected.top] + ' × ' + tier.shoeLabels[selected.shoes];
    const request = ++revision;
    preview.setAttribute('aria-busy', 'true');
    retryButton.hidden = true;
    retrySelection = null;
    status.textContent = 'コーディネートを切り替えています…';
    // 読込完了まで前の画像を保持し、最後の選択だけ反映する。
    const next = new Image();
    next.onload = () => {
      if (request !== revision) return;
      image.src = source;
      image.alt = tier.range + 'の参考：' + tier.topLabels[selected.top] + 'と' + tier.shoeLabels[selected.shoes] + 'を合わせたコーディネート';
      image.hidden = false;
      caption.textContent = label;
      shown = selected;
      preview.setAttribute('aria-busy', 'false');
      status.textContent = label + ' を表示中';
    };
    next.onerror = () => {
      if (request !== revision) return;
      // 表示と選択肢を揃える。初回失敗なら壊れた画像を隠して再試行を示す。
      retrySelection = selected;
      if (shown) choose(shown);
      else { image.hidden = true; caption.textContent = '画像を読み込めませんでした'; }
      preview.setAttribute('aria-busy', 'false');
      retryButton.hidden = false;
      status.textContent = shown
        ? '画像を読み込めなかったため、直前のコーデに戻しました。もう一度、組み合わせを選んでください。'
        : '画像を読み込めませんでした。再読み込みするか、別の組み合わせを選んでください。';
    };
    next.src = source;
  }

  tierSelect.addEventListener('change', () => {
    edited = true;
    choose({ tierId: tierSelect.value, top: 0, shoes: 0 });
    render();
  });
  editor.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener('change', () => {
    edited = true;
    selection = { tierId: selection.tierId,
      top: Number(editor.querySelector('input[name="editor-top"]:checked').value),
      shoes: Number(editor.querySelector('input[name="editor-shoes"]:checked').value) };
    render();
  }));
  $('reset-outfit').addEventListener('click', () => {
    edited = true;
    choose({ tierId: selection.tierId, top: 0, shoes: 0 });
    render();
  });
  weatherButton.addEventListener('click', () => {
    if (!catalog.forecastTierId) return;
    edited = false;
    choose({ tierId: catalog.forecastTierId, top: 0, shoes: 0 });
    render();
  });
  retryButton.addEventListener('click', () => {
    if (retrySelection) choose(retrySelection);
    render();
  });
  window.addEventListener('outfitforecast', () => {
    forecastNote();
    if (edited || !catalog.forecastTierId) return;
    choose({ tierId: catalog.forecastTierId, top: 0, shoes: 0 });
    render();
  });
  $('return-weather').addEventListener('click', () => {
    const result = $('result');
    const target = result.hidden ? $('planner') : result;
    if (result.hidden) target.open = true;
    const heading = target.querySelector('h2, summary');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  choose(selection);
  forecastNote();
  render();
})();
