# Requirements Document

## Introduction

Tính năng **Dark/Light Mode** cho phép người dùng chuyển đổi giữa giao diện sáng và tối trên toàn bộ ứng dụng SpringFood. Hệ thống sẽ tự động phát hiện preference của hệ điều hành, lưu trữ lựa chọn của người dùng, và đảm bảo tất cả các component hiện tại và tương lai đều hỗ trợ cả hai chế độ một cách nhất quán.

## Glossary

- **Theme_Service**: Service Angular quản lý trạng thái theme (light/dark/system)
- **Theme_Mode**: Chế độ giao diện - có thể là 'light', 'dark', hoặc 'system'
- **System_Preference**: Cài đặt `prefers-color-scheme` của hệ điều hành người dùng
- **CSS_Variables**: Custom properties trong CSS dùng để định nghĩa màu sắc theo theme
- **Theme_Toggle**: Component UI cho phép người dùng chuyển đổi theme
- **LocalStorage_Key**: Key `springfood-theme` dùng để lưu preference của người dùng

## Requirements

### Requirement 1

**User Story:** As a user, I want the application to remember my theme preference, so that I don't have to change it every time I visit.

#### Acceptance Criteria

1. WHEN the application starts for the first time THEN the Theme_Service SHALL detect the System_Preference and apply the corresponding theme
2. WHEN the user changes the theme THEN the Theme_Service SHALL store the preference in LocalStorage with key `springfood-theme`
3. WHEN the application starts and a preference exists in LocalStorage THEN the Theme_Service SHALL apply the stored preference
4. WHEN LocalStorage is unavailable THEN the Theme_Service SHALL fall back to System_Preference without errors

### Requirement 2

**User Story:** As a user, I want to toggle between light and dark mode, so that I can choose the interface that's comfortable for my eyes.

#### Acceptance Criteria

1. WHEN the user clicks the Theme_Toggle button THEN the system SHALL toggle between light and dark modes
2. WHEN the theme changes THEN the system SHALL apply the new theme within 200ms with a smooth transition
3. WHEN the application starts with 'system' preference THEN the system SHALL automatically follow System_Preference
4. WHEN in light mode THEN the Theme_Toggle SHALL display a moon icon (outline, no fill color)
5. WHEN in dark mode THEN the Theme_Toggle SHALL display a sun icon (outline, no fill color)
6. WHEN the user clicks the toggle THEN the icon SHALL animate smoothly to the other icon

### Requirement 6

**User Story:** As a user, I want the theme toggle to be easily accessible in the header, so that I can quickly change the theme from anywhere in the app.

#### Acceptance Criteria

1. WHEN viewing any page THEN the Theme_Toggle SHALL be visible in the Header component next to the language selector
2. WHEN the Theme_Toggle is displayed THEN it SHALL be a simple icon button without background color
3. WHEN hovering over the Theme_Toggle THEN the system SHALL provide subtle visual feedback
4. WHEN the Theme_Toggle animates THEN the transition SHALL use a rotation or morph effect between sun and moon icons

### Requirement 3

**User Story:** As a user, I want all UI elements to adapt to the selected theme, so that the entire application looks consistent.

#### Acceptance Criteria

1. WHEN the theme changes THEN all background colors SHALL transition smoothly to the new theme values
2. WHEN the theme changes THEN all text colors SHALL maintain proper contrast ratios (WCAG AA minimum 4.5:1)
3. WHEN the theme changes THEN all interactive elements (buttons, inputs, links) SHALL update their colors appropriately
4. WHEN the theme changes THEN all shadows and borders SHALL adapt to maintain visual hierarchy

### Requirement 4

**User Story:** As a developer, I want a centralized theme system with CSS variables, so that new components automatically support both themes.

#### Acceptance Criteria

1. WHEN creating new components THEN developers SHALL use CSS variables from the theme system instead of hardcoded colors
2. WHEN the dark class is applied to the document THEN all CSS variables SHALL update to their dark theme values
3. WHEN defining theme colors THEN the system SHALL provide semantic naming (bg-primary, text-primary, etc.) for clarity
4. WHEN the theme system initializes THEN it SHALL apply the theme class to the `<html>` element before first paint

### Requirement 5

**User Story:** As a user, I want the theme transition to be smooth and not jarring, so that switching themes feels natural.

#### Acceptance Criteria

1. WHEN transitioning between themes THEN the system SHALL apply a CSS transition of 200ms to color properties
2. WHEN the page first loads THEN the system SHALL prevent flash of wrong theme by applying theme class synchronously
3. WHEN the system preference changes while using 'system' mode THEN the theme SHALL update without page reload
4. WHEN animations are disabled (prefers-reduced-motion) THEN the system SHALL skip transition animations

