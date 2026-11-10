export interface Example {
  title: string;
  html: string;
}

const arrowRight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
const search = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
const shield = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1 1 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;

export const examples: Record<string, Example[]> = {
  alert: [
    {
      title: "Default",
      html: `<div class="alert" role="alert">
  <h3 data-slot="title">Heads up!</h3>
  <section>
    <p>You can add components to your app using the CLI.</p>
  </section>
</div>`
    },
    {
      title: "Destructive",
      html: `<div class="alert" data-variant="destructive" role="alert">
  <h3 data-slot="title">Session expired</h3>
  <section>
    <p>Please log in again to continue.</p>
  </section>
</div>`
    }
  ],
  "alert-dialog": [
    {
      title: "Delete account",
      html: `<button type="button" class="btn" data-variant="destructive" data-open-dialog="demo-alert-dialog">
  Delete account
</button>

<dialog class="alert-dialog" id="demo-alert-dialog" aria-labelledby="alert-title" aria-describedby="alert-description">
  <div>
    <header>
      <figure>${shield}</figure>
      <h2 data-slot="title" id="alert-title">Are you absolutely sure?</h2>
      <p data-slot="description" id="alert-description">
        This action cannot be undone. This will permanently delete your account and remove your data.
      </p>
    </header>
    <footer>
      <button type="button" class="btn" data-variant="outline" data-close-dialog>Cancel</button>
      <button type="button" class="btn" data-variant="destructive" data-close-dialog>Delete</button>
    </footer>
  </div>
</dialog>`
    }
  ],
  badge: [
    {
      title: "Variants",
      html: `<div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
  <span class="badge">Default</span>
  <span class="badge" data-variant="secondary">Secondary</span>
  <span class="badge" data-variant="outline">Outline</span>
  <span class="badge" data-variant="destructive">Destructive</span>
  <span class="badge" data-variant="ghost">Ghost</span>
  <span class="badge" data-variant="link">Link</span>
</div>`
    }
  ],
  button: [
    {
      title: "Variants",
      html: `<div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
  <button class="btn">Default</button>
  <button class="btn" data-variant="secondary">Secondary</button>
  <button class="btn" data-variant="outline">Outline</button>
  <button class="btn" data-variant="ghost">Ghost</button>
  <button class="btn" data-variant="link">Link</button>
  <button class="btn" data-variant="destructive">Destructive</button>
</div>`
    },
    {
      title: "Sizes and icons",
      html: `<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem">
  <button class="btn" data-size="xs">Extra small</button>
  <button class="btn" data-size="sm">Small</button>
  <button class="btn">Default</button>
  <button class="btn" data-size="lg">Large</button>
  <button class="btn" data-size="icon" aria-label="Next">${arrowRight}</button>
  <button class="btn" data-size="icon-sm" aria-label="Next">${arrowRight}</button>
  <button class="btn" data-size="icon-lg" aria-label="Next">${arrowRight}</button>
  <button class="btn"><svg data-icon="inline-start" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>Icon and text</button>
</div>`
    }
  ],
  "button-group": [
    {
      title: "Horizontal",
      html: `<div class="button-group">
  <button class="btn" data-variant="outline">Left</button>
  <button class="btn" data-variant="outline">Center</button>
  <button class="btn" data-variant="outline">Right</button>
</div>`
    },
    {
      title: "Vertical",
      html: `<div class="button-group" data-orientation="vertical">
  <button class="btn" data-variant="outline">Top</button>
  <button class="btn" data-variant="outline">Middle</button>
  <button class="btn" data-variant="outline">Bottom</button>
</div>`
    }
  ],
  card: [
    {
      title: "Default",
      html: `<div class="card" style="max-width: 24rem">
  <header data-separator="bottom">
    <h3 data-slot="title">Create project</h3>
    <p data-slot="description">Deploy your new project in one click.</p>
    <a class="card-action" href="#">Docs</a>
  </header>
  <section>
    <div class="field">
      <label class="label" for="card-name">Name</label>
      <input class="input" id="card-name" placeholder="My project">
    </div>
  </section>
  <footer style="display: flex; justify-content: flex-end; gap: 0.5rem">
    <button class="btn" data-variant="outline">Cancel</button>
    <button class="btn">Create</button>
  </footer>
</div>`
    }
  ],
  checkbox: [
    {
      title: "Default",
      html: `<div class="field">
  <label class="label" for="demo-checkbox">
    <input class="checkbox" type="checkbox" id="demo-checkbox" checked>
    Accept terms and conditions
  </label>
  <p>You agree to our Terms of Service and Privacy Policy.</p>
</div>`
    }
  ],
  dialog: [
    {
      title: "Edit profile",
      html: `<button type="button" class="btn" data-open-dialog="demo-dialog">Open dialog</button>

<dialog class="dialog" id="demo-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <div>
    <header>
      <h2 data-slot="title" id="dialog-title">Edit profile</h2>
      <p data-slot="description" id="dialog-description">
        Make changes to your profile here. Click save when you're done.
      </p>
    </header>
    <section>
      <div class="field">
        <label class="label" for="dialog-name">Name</label>
        <input class="input" id="dialog-name" value="Ada Lovelace">
      </div>
    </section>
    <footer>
      <button type="button" class="btn" data-variant="outline" data-close-dialog>Cancel</button>
      <button type="button" class="btn" data-close-dialog>Save changes</button>
    </footer>
    <form method="dialog">
      <button class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Close">×</button>
    </form>
  </div>
</dialog>`
    }
  ],
  "dropdown-menu": [
    {
      title: "Default",
      html: `<div class="dropdown-menu" data-demo="dropdown">
  <button type="button" class="btn" data-variant="outline" data-demo-trigger aria-haspopup="menu" aria-expanded="false">
    Open menu
  </button>
  <div data-popover data-side="bottom" aria-hidden="true">
    <div role="menu">
      <button type="button" role="menuitem">Profile</button>
      <button type="button" role="menuitem">Billing</button>
      <button type="button" role="menuitem">Settings <span class="kbd">⌘S</span></button>
      <div role="separator"></div>
      <button type="button" role="menuitem" data-variant="destructive">Delete account</button>
    </div>
  </div>
</div>`
    }
  ],
  empty: [
    {
      title: "Default",
      html: `<div class="empty">
  <header>
    <figure>${search}</figure>
    <h2>No results found</h2>
    <p>Try adjusting your search or filters.</p>
  </header>
  <section>
    <button class="btn" data-variant="outline">Clear filters</button>
  </section>
</div>`
    }
  ],
  field: [
    {
      title: "Vertical",
      html: `<div class="field">
  <label class="label" for="demo-field-email">Email</label>
  <input class="input" id="demo-field-email" type="email" placeholder="you@example.com">
  <p>We'll never share your email with anyone else.</p>
</div>`
    },
    {
      title: "Horizontal",
      html: `<div class="field" data-orientation="horizontal">
  <section>
    <label class="label" for="demo-field-notifications">Notifications</label>
    <p>Receive emails about new features.</p>
  </section>
  <input class="switch" type="checkbox" role="switch" id="demo-field-notifications">
</div>`
    }
  ],
  input: [
    {
      title: "Default",
      html: `<input class="input" type="email" placeholder="you@example.com">`
    },
    {
      title: "Invalid",
      html: `<div class="field">
  <label class="label" for="demo-input-invalid">Username</label>
  <input class="input" id="demo-input-invalid" aria-invalid="true" value="invalid name">
  <p role="alert">Username may only contain letters and numbers.</p>
</div>`
    }
  ],
  item: [
    {
      title: "Item group",
      html: `<div class="item-group">
  <div class="item" data-variant="outline">
    <figure>${shield}</figure>
    <section>
      <h3>Security</h3>
      <p>Manage your account security settings.</p>
    </section>
    <aside>
      <button class="btn" data-size="sm" data-variant="outline">Manage</button>
    </aside>
  </div>
  <hr>
  <div class="item" data-variant="muted">
    <section>
      <h3>Notifications</h3>
      <p>Choose what you want to be notified about.</p>
    </section>
  </div>
</div>`
    }
  ],
  kbd: [
    {
      title: "Default",
      html: `<div style="display: flex; align-items: center; gap: 0.5rem">
  <span class="kbd">⌘</span>
  <span class="kbd">K</span>
  <span>Open command menu</span>
</div>`
    }
  ],
  label: [
    {
      title: "Default",
      html: `<div class="field">
  <label class="label" for="demo-label">Your name</label>
  <input class="input" id="demo-label" placeholder="Ada Lovelace">
</div>`
    }
  ],
  "native-select": [
    {
      title: "Default",
      html: `<div class="field">
  <label class="label" for="demo-select">Framework</label>
  <select class="native-select" id="demo-select">
    <option>Next.js</option>
    <option>Astro</option>
    <option>SvelteKit</option>
    <option>Nuxt</option>
  </select>
</div>`
    }
  ],
  popover: [
    {
      title: "Default",
      html: `<div class="popover" data-demo="popover">
  <button type="button" class="btn" data-variant="outline" data-demo-trigger aria-expanded="false">
    Open popover
  </button>
  <div data-popover data-side="bottom" aria-hidden="true">
    <header data-slot="header">
      <h3 data-slot="title">Dimensions</h3>
      <p data-slot="description">Set the dimensions for the layer.</p>
    </header>
    <div class="field">
      <label class="label" for="popover-width">Width</label>
      <input class="input" id="popover-width" value="100%">
    </div>
  </div>
</div>`
    }
  ],
  radio: [
    {
      title: "Default",
      html: `<div class="field" role="radiogroup" aria-label="Plan">
  <label class="label">
    <input class="radio" type="radio" name="plan" checked>
    Starter
  </label>
  <label class="label">
    <input class="radio" type="radio" name="plan">
    Pro
  </label>
  <label class="label">
    <input class="radio" type="radio" name="plan">
    Enterprise
  </label>
</div>`
    }
  ],
  skeleton: [
    {
      title: "Default",
      html: `<div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 20rem">
  <div class="skeleton" style="height: 1rem; width: 60%"></div>
  <div class="skeleton" style="height: 1rem; width: 100%"></div>
  <div class="skeleton" style="height: 1rem; width: 80%"></div>
</div>`
    }
  ],
  switch: [
    {
      title: "Default",
      html: `<label class="label" for="demo-switch">
  <input class="switch" type="checkbox" role="switch" id="demo-switch" checked>
  Airplane mode
</label>`
    }
  ],
  table: [
    {
      title: "Default",
      html: `<div class="table-container">
  <table class="table">
    <caption>A list of your recent invoices.</caption>
    <thead>
      <tr>
        <th>Invoice</th>
        <th>Status</th>
        <th>Method</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>INV-001</td>
        <td>Paid</td>
        <td>Credit card</td>
        <td>$250.00</td>
      </tr>
      <tr aria-selected="true">
        <td>INV-002</td>
        <td>Pending</td>
        <td>PayPal</td>
        <td>$150.00</td>
      </tr>
      <tr>
        <td>INV-003</td>
        <td>Unpaid</td>
        <td>Bank transfer</td>
        <td>$350.00</td>
      </tr>
    </tbody>
  </table>
</div>`
    }
  ],
  tabs: [
    {
      title: "Default",
      html: `<div class="tabs" data-demo="tabs">
  <div role="tablist" aria-orientation="horizontal">
    <button type="button" role="tab" id="tab-account" aria-selected="true" aria-controls="panel-account">Account</button>
    <button type="button" role="tab" id="tab-password" aria-selected="false" aria-controls="panel-password" tabindex="-1">Password</button>
  </div>
  <div role="tabpanel" id="panel-account" aria-labelledby="tab-account">
    <p>Make changes to your account here.</p>
  </div>
  <div role="tabpanel" id="panel-password" aria-labelledby="tab-password" hidden>
    <p>Change your password here.</p>
  </div>
</div>`
    },
    {
      title: "Line variant",
      html: `<div class="tabs" data-demo="tabs">
  <div role="tablist" aria-orientation="horizontal" data-variant="line">
    <button type="button" role="tab" id="tab-overview" aria-selected="true" aria-controls="panel-overview">Overview</button>
    <button type="button" role="tab" id="tab-activity" aria-selected="false" aria-controls="panel-activity" tabindex="-1">Activity</button>
  </div>
  <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
    <p>An overview of your project.</p>
  </div>
  <div role="tabpanel" id="panel-activity" aria-labelledby="tab-activity" hidden>
    <p>Recent activity in your project.</p>
  </div>
</div>`
    }
  ],
  textarea: [
    {
      title: "Default",
      html: `<div class="field">
  <label class="label" for="demo-textarea">Message</label>
  <textarea class="textarea" id="demo-textarea" placeholder="Type your message here."></textarea>
  <p>Your message will be copied to the support team.</p>
</div>`
    }
  ],
  tooltip: [
    {
      title: "Default",
      html: `<button type="button" class="btn tooltip" data-tooltip="Add to library" data-arrow>
  Add to library
</button>`
    }
  ]
};
