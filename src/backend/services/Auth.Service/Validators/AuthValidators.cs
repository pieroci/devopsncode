using FluentValidation;
using GamePlatform.Common.Constants;
using GamePlatform.Contracts.Auth;

namespace GamePlatform.Auth.Service.Validators;

/// <summary>
/// Register request validator
/// Implements validation rules following business requirements
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .MinimumLength(GameConstants.MinUsernameLength).WithMessage($"Username must be at least {GameConstants.MinUsernameLength} characters")
            .MaximumLength(GameConstants.MaxUsernameLength).WithMessage($"Username must not exceed {GameConstants.MaxUsernameLength} characters")
            .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Username can only contain letters, numbers, underscores and hyphens");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email must be valid");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(GameConstants.MinPasswordLength).WithMessage($"Password must be at least {GameConstants.MinPasswordLength} characters")
            .MaximumLength(GameConstants.MaxPasswordLength).WithMessage($"Password must not exceed {GameConstants.MaxPasswordLength} characters")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain at least one number");

        RuleFor(x => x.SelectedWorldId)
            .GreaterThan(0).WithMessage("A valid world must be selected");
    }
}

/// <summary>
/// Login request validator
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty().WithMessage("Email or username is required");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}

/// <summary>
/// Refresh token request validator
/// </summary>
public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}
