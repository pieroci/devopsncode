using FluentValidation;
using GamePlatform.Contracts.World;

namespace GamePlatform.World.Service.Validators;

/// <summary>
/// Create world request validator
/// Implements validation rules following business requirements
/// </summary>
public class CreateWorldRequestValidator : AbstractValidator<CreateWorldRequest>
{
    public CreateWorldRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("World name is required")
            .MinimumLength(3).WithMessage("World name must be at least 3 characters")
            .MaximumLength(100).WithMessage("World name must not exceed 100 characters")
            .Matches("^[a-zA-Z0-9 -]+$").WithMessage("World name can only contain letters, numbers, spaces and hyphens");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("Max capacity must be greater than 0")
            .LessThanOrEqualTo(10000).WithMessage("Max capacity cannot exceed 10,000")
            .Must(x => x % 100 == 0).WithMessage("Max capacity should be a multiple of 100");

        RuleFor(x => x.Region)
            .MaximumLength(50).WithMessage("Region must not exceed 50 characters")
            .When(x => !string.IsNullOrEmpty(x.Region));
    }
}

/// <summary>
/// Update world request validator
/// </summary>
public class UpdateWorldRequestValidator : AbstractValidator<UpdateWorldRequest>
{
    public UpdateWorldRequestValidator()
    {
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("Max capacity must be greater than 0")
            .LessThanOrEqualTo(10000).WithMessage("Max capacity cannot exceed 10,000")
            .Must(x => x % 100 == 0).WithMessage("Max capacity should be a multiple of 100")
            .When(x => x.MaxCapacity.HasValue);
    }
}
