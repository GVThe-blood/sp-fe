---
inclusion: auto
---

# Angular Frontend Development Rules

## CRITICAL: Always Activate Angular 19 Skill

**BEFORE writing ANY Angular code, you MUST activate the Angular 19 skill:**

```
discloseContext(name: "angular-19")
```

## When to Activate Angular 19 Skill

Activate the skill IMMEDIATELY when user asks about:
- Creating/modifying Angular components
- Angular services, directives, pipes
- Angular routing, forms, HTTP
- State management with signals
- RxJS and observables
- Angular templates and control flow
- Dependency injection
- Component lifecycle
- Any Angular-related task

## Angular 19 Patterns (Quick Reference)

### ✅ ALWAYS USE:
- `standalone: true` components
- `inject()` for DI (NOT constructor injection)
- `signal()`, `computed()`, `effect()` for state
- `input()`, `output()`, `model()` (NOT @Input/@Output decorators)
- `@if`, `@for`, `@switch` (NOT *ngIf, *ngFor, *ngSwitch)
- `viewChild()`, `viewChildren()` (NOT @ViewChild decorator)
- `ChangeDetectionStrategy.OnPush` with signals
- `track` expression in ALL `@for` loops

### ❌ NEVER USE:
- NgModules for new code
- `@Input()`, `@Output()` decorators
- `@ViewChild()`, `@ContentChild()` decorators
- `*ngIf`, `*ngFor`, `*ngSwitch` directives
- Constructor injection (use `inject()` instead)
- `ChangeDetectionStrategy.Default`

## Project Context

- **Framework**: Angular 19.2
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Signals (signal, computed, effect)
- **HTTP**: HttpClient with interceptors
- **Routing**: Standalone components with lazy loading
- **i18n**: ngx-translate
- **Notifications**: @ngxpert/hot-toast

## Workflow

1. **User asks Angular task** → Activate angular-19 skill FIRST
2. **Read existing code** → Understand current patterns
3. **Write code** → Follow Angular 19 patterns from skill
4. **Build & verify** → Run `npm run build` to check errors
5. **Test** → Verify in browser

## Example

```typescript
// ✅ CORRECT Angular 19 Pattern
import { Component, signal, computed, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading()) {
      <div>Loading...</div>
    } @else {
      <ul>
        @for (item of items(); track item.id) {
          <li>{{ item.name }}</li>
        }
      </ul>
    }
  `
})
export class ExampleComponent {
  private toast = inject(HotToastService);
  
  items = signal<Item[]>([]);
  isLoading = signal(false);
  itemCount = computed(() => this.items().length);
  
  loadItems(): void {
    this.isLoading.set(true);
    // ... load data
    this.toast.success('Items loaded');
  }
}
```

## Remember

**ALWAYS activate angular-19 skill BEFORE writing Angular code!**

This ensures you follow the latest Angular 19 patterns and best practices.
