# Using _hyperscript in bla.gg

## Overview

**bla.gg** relies on _hyperscript for client-side interactions. Key is separating UI logic from JavaScript by defining event functions within HTML using _ attributes, making complex tasks automatic and easy-to-read.

Benefits of hyperscript

Clear UI Functionality : We define behavior right in HTML, allowing you to grasp component purpose at a glance.
Cleaner JS Code : Reduced event listeners mean more focused business logic in JavaScript.
Self-explanatory Code : The code explains its actions at the element level, so you know what's happening every step of the way.
Faster Creation : Simple interactions can be implemented without switching between files.
## How _hyperscript Works in bla.gg

### Basic Pattern

```html
<button _="on click call app.someFunction()">Click Me</button>
```

This tells the button to call `app.someFunction()` when clicked. The JavaScript function is exposed through the global `window.app` object.

### Common Patterns Used in bla.gg

1. **Simple Function Calls**:
   ```html
   <button id="startCallBtn" 
     _="on click 
         add .loading to me
         call app.handleStartCall() 
         remove .loading from me">Start Call</button>
   ```

2. **Conditional Logic**:
   ```html
   <button id="toggleMuteBtn" 
     _="on click 
         toggle .muted on me
         if I match .muted
           call app.toggleMute(true)
           set @innerHTML to 'Unmute'
         else
           call app.toggleMute(false)
           set @innerHTML to 'Mute'
         end">Mute</button>
   ```

3. **Form Handling**:
   ```html
   <form id="authForm" 
     _="on submit 
         halt
         add .loading to #loginBtn
         call app.handleLogin() 
         remove .loading from #loginBtn">
   ```

4. **Real-time Input Validation**:
   ```html
   <input type="text" id="username" placeholder="Username" 
     _="on keyup debounced at 500ms
         if my value is not empty
           call app.checkUsernameAvailability(my value)
         else
           remove .available .unavailable from #usernameStatus
           set #usernameStatus.textContent to ''
         end">
   ```

## JavaScript Integration

In `app.js`, we expose functions to _hyperscript by adding them to the `window.app` object:

```javascript
// Expose methods to window for _hyperscript to access
window.app = {
  handleLogin: this.handleLogin.bind(this),
  handleSignup: this.handleSignup.bind(this),
  // ... other methods
};
```

This approach:
1. Keeps core application logic in JavaScript
2. Makes functions accessible to _hyperscript in HTML
3. Maintains proper `this` binding via `.bind(this)`

## Adding New UI Interactions

To add a new interactive UI element:

1. **Add the HTML element** with a _hyperscript attribute:
   ```html
   <button id="newFeatureBtn" 
     _="on click
         add .active to me
         call app.handleNewFeature()
         remove .active from me">New Feature</button>
   ```

2. **Add the corresponding JavaScript function** in the appropriate class:
   ```javascript
   // Handle the new feature
   handleNewFeature() {
     // Implementation here
   }
   ```

3. **Expose the function** via the window.app object:
   ```javascript
   window.app = {
     // ... existing methods
     handleNewFeature: this.handleNewFeature.bind(this)
   };
   ```

## Best Practices

1. **Keep _hyperscript code focused on UI concerns** - use it for:
   - Toggling classes
   - Simple UI state changes
   - Calling JavaScript functions for business logic
   - Basic form validation

2. **Keep complex logic in JavaScript** - move to JS when:
   - Working with complex data structures
   - Performing API calls or database operations
   - Implementing business rules
   - Handling complex validation

3. **Use proper JavaScript for testing** - _hyperscript behaviors can be triggered programmatically in tests:
   ```javascript
   // Example test
   document.getElementById('loginBtn').click(); // Triggers the _hyperscript behavior
   ```

## Resources

- [_hyperscript Official Documentation](https://hyperscript.org/docs/)
- [_hyperscript Features Reference](https://hyperscript.org/features/)
- [_hyperscript Examples](https://hyperscript.org/examples/) 