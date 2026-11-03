// Portfolio-only enhancements. All case studies and source links remain readable without JavaScript.
const dialog = document.querySelector('#product-walkthrough');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

const walkthroughs = {
  waybl: {
    name: 'Waybl', title: 'Waybl / inside the live website',
    steps: [
      { title: 'The public website.', description: 'The actual Waybl homepage, with its marketplace preview and introduction to parcel delivery with travellers.', label: 'Homepage', image: 'waybl.jpg', alt: 'Waybl homepage with the marketplace phone preview', source: 'https://waybl.app/' },
      { title: 'The delivery journey.', description: 'The live how-it-works section explains posting a parcel or trip, confirming a match, and verifying handover.', label: 'How it works', image: 'waybl-journey.jpg', alt: 'Waybl how-it-works section with three delivery stages', source: 'https://waybl.app/#how-it-works' },
      { title: 'Making escrow understandable.', description: 'The real escrow section explains how funding, handover and delivery connect to payment release.', label: 'Escrow', image: 'waybl-escrow.jpg', alt: 'Waybl live escrow section and wallet preview', source: 'https://waybl.app/#escrow' },
    ],
  },
  ara: {
    name: 'Àrà', title: 'Àrà / the studio and its tools',
    steps: [
      { title: 'A studio with its own identity.', description: 'The actual Àrà homepage, with its Nigerian textile-inspired patterns and studio positioning.', label: 'Homepage', image: 'ara.jpg', alt: 'Àrà homepage with indigo patterns and gold typography', source: 'https://ara.ayodeji.xyz/' },
      { title: 'The real AI tool interface.', description: 'The live tools section with the idea-spec tab selected. This capture shows the interface; no AI request was submitted.', label: 'AI tools', image: 'ara-tools.jpg', alt: 'Àrà live AI tools interface with the Spec my idea tab selected', source: 'https://ara.ayodeji.xyz/#ai-tools' },
      { title: 'A design system you can explore.', description: 'The public Design Lab shows interactive Adire patterns and Aso-oke weaving alongside the studio’s motion experiments.', label: 'Design Lab', image: 'ara-lab.jpg', alt: 'Àrà Design Lab with Adire pattern and Aso-oke weave controls', source: 'https://ara.ayodeji.xyz/#lab' },
    ],
  },
  safetrip: {
    name: 'SafeTrip', title: 'SafeTrip / transport on the live site',
    steps: [
      { title: 'The real transport website.', description: 'The SafeTrip homepage uses its own fleet photography and connects city transport, interstate travel and logistics.', label: 'Homepage', image: 'safetrip.jpg', alt: 'SafeTrip homepage with fleet photography and Within Lagos Across Nigeria heading', source: 'https://www.safetripbuses.com/' },
      { title: 'The booking interface.', description: 'The actual public interstate booking page. Travellers can choose route, date and passenger count; no reservation was submitted for this capture.', label: 'Interstate', image: 'safetrip-booking.jpg', alt: 'SafeTrip public interstate page with route date and passenger controls', source: 'https://www.safetripbuses.com/book' },
      { title: 'The fleet behind the service.', description: 'The live fleet page shows SafeTrip’s vehicle photographs and the services each vehicle supports.', label: 'Fleet', image: 'safetrip-fleet.jpg', alt: 'SafeTrip fleet page with vehicle photographs', source: 'https://www.safetripbuses.com/fleet' },
    ],
  },
};

// Native anchor navigation also opens the appropriate case study, including deep links.
function openLinkedCase() {
  const id = window.location.hash.slice(1);
  const target = document.getElementById(id);
  if (target?.matches('details.project')) target.open = true;
}
window.addEventListener('hashchange', openLinkedCase);
openLinkedCase();
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#case-"]');
  if (link) {
    const target = document.getElementById(link.hash.slice(1));
    if (target?.matches('details.project')) target.open = true;
  }
});

if (dialog && typeof dialog.showModal === 'function') {
  let active;
  let stepIndex = 0;
  let timer;
  let playing = false;
  let opener;
  const list = dialog.querySelector('.demo-step-list');
  const status = document.querySelector('#demo-status');
  const play = document.querySelector('#demo-play');
  const previous = document.querySelector('#demo-previous');
  const next = document.querySelector('#demo-next');

  function stop() {
    window.clearTimeout(timer);
    playing = false;
    play.textContent = stepIndex === active.steps.length - 1 ? 'Replay' : 'Play';
  }

  function render() {
    const step = active.steps[stepIndex];
    document.querySelector('#demo-count').textContent = `Screen ${stepIndex + 1} / ${active.steps.length}`;
    document.querySelector('#demo-step-title').textContent = step.title;
    document.querySelector('#demo-step-description').textContent = step.description;
    const image = document.querySelector('#demo-screen-image');
    const imagePath = `images/portfolio/${step.image}`;
    image.src = imagePath;
    image.alt = step.alt;
    document.querySelector('#demo-image-link').href = imagePath;
    document.querySelector('#demo-source-link').href = step.source;
    list.replaceChildren();
    active.steps.forEach((item, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${String(index + 1).padStart(2, '0')} / ${item.label}`;
      button.setAttribute('aria-current', index === stepIndex ? 'step' : 'false');
      button.addEventListener('click', () => { stop(); stepIndex = index; render(); list.querySelectorAll('button')[index].focus(); });
      li.append(button);
      list.append(li);
    });
    dialog.querySelector('.demo-stage').dataset.stage = String(stepIndex);
    previous.disabled = stepIndex === 0;
    next.disabled = stepIndex === active.steps.length - 1;
    play.textContent = playing ? 'Pause' : stepIndex === active.steps.length - 1 ? 'Replay' : 'Play';
    status.textContent = `${stepIndex + 1} of ${active.steps.length}: ${step.title}${motionPreference.matches ? ' Reduced motion: use the screen controls to continue.' : ''}`;
  }

  function schedule() {
    timer = window.setTimeout(() => {
      if (!dialog.open || !playing) return;
      stepIndex += 1;
      if (stepIndex >= active.steps.length - 1) stop();
      render();
      if (playing) schedule();
    }, 4200);
  }

  for (const button of document.querySelectorAll('[data-demo]')) {
    if (!walkthroughs[button.dataset.demo]) continue;
    button.hidden = false;
    button.addEventListener('click', () => {
      active = walkthroughs[button.dataset.demo];
      opener = button;
      stepIndex = 0;
      stop();
      document.querySelector('#walkthrough-title').textContent = active.title;
      document.querySelector('#demo-product-name').textContent = active.name;
      dialog.dataset.product = button.dataset.demo;
      render();
      dialog.showModal();
      // Motion preference also controls autoplay; explicit manual controls remain available.
      if (!motionPreference.matches) { playing = true; render(); schedule(); }
    });
  }
  previous.addEventListener('click', () => { stop(); stepIndex = Math.max(0, stepIndex - 1); render(); });
  next.addEventListener('click', () => { stop(); stepIndex = Math.min(active.steps.length - 1, stepIndex + 1); render(); });
  play.addEventListener('click', () => {
    if (playing) { stop(); render(); return; }
    if (stepIndex === active.steps.length - 1) stepIndex = 0;
    playing = true;
    render();
    schedule();
  });
  dialog.querySelector('.walkthrough-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { stop(); opener?.focus(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && dialog.open) { stop(); render(); } });
  motionPreference.addEventListener('change', () => { if (dialog.open) { stop(); render(); } });
}
