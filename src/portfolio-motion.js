// Portfolio-only enhancements. All case studies remain readable without JavaScript.
const dialog = document.querySelector('#product-walkthrough');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

const walkthroughs = {
  waybl: {
    name: 'Waybl', title: 'A parcel journey, with trust built in.',
    steps: [
      { title: 'Find someone already going.', description: 'Match the parcel journey with a Carrier travelling along the same route.', label: 'Match', eyebrow: '01 / A shared direction', headline: 'Lagos → Abuja', lines: ['Sender: a parcel to send', 'Carrier: space on a planned trip'], result: 'Start with the route, not an empty vehicle.' },
      { title: 'Confirm before funding.', description: 'Acceptance is a clear checkpoint. Funding follows confirmation so the customer understands the commitment.', label: 'Confirm', eyebrow: '02 / Make the agreement clear', headline: 'Trip accepted', lines: ['Route and parcel details reviewed', 'Funding comes after acceptance'], result: 'One clear agreement between both sides.' },
      { title: 'Verify the handover.', description: 'A four-digit code adds a shared checkpoint when the Sender hands the parcel to the Carrier.', label: 'Hand over', eyebrow: '03 / A secure exchange', headline: '••••', lines: ['Four-digit handover code', 'Verify the exchange before continuing'], result: 'A deliberate checkpoint, not a guess.' },
      { title: 'Close the loop.', description: 'Delivery confirmation completes the journey, with support and dispute paths available when needed.', label: 'Complete', eyebrow: '04 / The final checkpoint', headline: 'Delivery confirmed', lines: ['Journey completion recorded', 'Recovery paths for exceptions'], result: 'Design the happy path and the unhappy ones.' },
    ],
  },
  ara: {
    name: 'Àrà', title: 'From a rough idea to a useful brief.',
    steps: [
      { title: 'Start with the business problem.', description: 'The idea-to-spec tool starts with what the person wants to solve, before jumping to a feature list.', label: 'Describe', eyebrow: '01 / An example brief', headline: 'Make booking simpler.', lines: ['Example: a small service business', 'Problem: requests scattered across chats'], result: 'Sample input · no data is sent to an AI service.' },
      { title: 'Give the idea a shape.', description: 'A structured brief makes the users, problem and intended outcome easier to discuss.', label: 'Structure', eyebrow: '02 / Illustrative output', headline: 'A clearer starting point.', lines: ['Who: customers and the business owner', 'Goal: one place to manage requests'], result: 'Turn a vague request into a conversation starter.' },
      { title: 'Keep the first version focused.', description: 'A bounded scope gives the build a practical starting point. The actual AI tools are available on the studio website.', label: 'Scope', eyebrow: '03 / An example first version', headline: 'Small enough to ship.', lines: ['Booking request and status', 'Simple owner dashboard'], result: 'Illustration only · the live tool generates its own output.' },
    ],
  },
  safetrip: {
    name: 'SafeTrip', title: 'From choosing a route to choosing a seat.',
    steps: [
      { title: 'Choose the journey.', description: 'Start with origin and destination. These cities illustrate the flow and do not represent current availability.', label: 'Search', eyebrow: '01 / Example route', headline: 'Lagos → Abuja', lines: ['Origin: Lagos', 'Destination: Abuja'], result: 'A clear entry point for interstate travel.' },
      { title: 'Compare the options.', description: 'Schedules and availability help travellers choose a departure. No live schedules or prices are loaded here.', label: 'Compare', eyebrow: '02 / Illustrative schedules', headline: 'Find a departure.', lines: ['Review the travel date', 'Compare available schedules'], result: 'Keep the choice understandable before booking.' },
      { title: 'Make the seat choice visible.', description: 'Seat selection makes the booking concrete. This illustration uses sample seats and reserves nothing.', label: 'Choose a seat', eyebrow: '03 / Sample seat selection', headline: 'Your place on board.', lines: ['Seat 06 highlighted as an example', 'Availability checked by the live service'], result: 'A visible choice, with an explicit review step.' },
      { title: 'Review before continuing.', description: 'Bring the route, schedule and seat together before the traveller continues in the live product.', label: 'Review', eyebrow: '04 / Example booking summary', headline: 'The journey, in one place.', lines: ['Route and schedule together', 'Selected seat ready for review'], result: 'Concept complete · no booking has been made.' },
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
  const screen = document.querySelector('#demo-screen');
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
    document.querySelector('#demo-count').textContent = `Step ${stepIndex + 1} / ${active.steps.length}`;
    document.querySelector('#demo-step-title').textContent = step.title;
    document.querySelector('#demo-step-description').textContent = step.description;
    // All content is authored locally, never user input or remote HTML.
    screen.replaceChildren();
    const eyebrow = document.createElement('p');
    eyebrow.className = 'demo-eyebrow';
    eyebrow.textContent = step.eyebrow;
    const heading = document.createElement('p');
    heading.className = 'demo-headline';
    heading.textContent = step.headline;
    const lines = document.createElement('ul');
    for (const text of step.lines) {
      const line = document.createElement('li');
      line.textContent = text;
      lines.append(line);
    }
    // A visible seat map is an illustration, not a misleading reservable control.
    if (active === walkthroughs.safetrip && stepIndex === 2) {
      const seats = document.createElement('div');
      seats.className = 'demo-seats';
      seats.setAttribute('aria-hidden', 'true');
      for (let i = 1; i <= 12; i += 1) {
        const seat = document.createElement('span');
        seat.textContent = String(i).padStart(2, '0');
        if (i === 6) seat.className = 'selected';
        seats.append(seat);
      }
      const seatRow = document.createElement('li');
      seatRow.append(seats);
      lines.append(seatRow);
    }
    const result = document.createElement('p');
    result.className = 'demo-result';
    result.textContent = step.result;
    screen.append(eyebrow, heading, lines, result);
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
    status.textContent = `${stepIndex + 1} of ${active.steps.length}: ${step.title}${motionPreference.matches ? ' Reduced motion: use the step controls to continue.' : ''}`;
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
