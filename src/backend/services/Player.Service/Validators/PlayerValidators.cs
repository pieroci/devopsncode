using FluentValidation;
using GamePlatform.Player.Service.Services;

namespace GamePlatform.Player.Service.Validators;

/// <summary>
/// Create player request validator
/// Implements validation rules following business requirements
/// </summary>
public class CreatePlayerRequestValidator : AbstractValidator<CreatePlayerRequest>
{
    public CreatePlayerRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("User ID must be greater than 0");

        RuleFor(x => x.WorldId)
            .GreaterThan(0).WithMessage("World ID must be greater than 0");

        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("Display name is required")
            .MinimumLength(3).WithMessage("Display name must be at least 3 characters")
            .MaximumLength(50).WithMessage("Display name must not exceed 50 characters")
            .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Display name can only contain letters, numbers, underscores and hyphens");
    }
}

/// <summary>
/// Update player request validator
/// </summary>
public class UpdatePlayerRequestValidator : AbstractValidator<UpdatePlayerRequest>
{
    public UpdatePlayerRequestValidator()
    {
        RuleFor(x => x.DisplayName)
            .MinimumLength(3).WithMessage("Display name must be at least 3 characters")
            .MaximumLength(50).WithMessage("Display name must not exceed 50 characters")
            .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Display name can only contain letters, numbers, underscores and hyphens")
            .When(x => !string.IsNullOrEmpty(x.DisplayName));

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(500).WithMessage("Avatar URL must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.AvatarUrl));
    }
}

/// <summary>
/// Add experience request validator
/// </summary>
public class AddExperienceRequestValidator : AbstractValidator<AddExperienceRequest>
{
    public AddExperienceRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Experience amount must be greater than 0")
            .LessThanOrEqualTo(1000000).WithMessage("Experience amount cannot exceed 1,000,000 per request");
    }
}

/// <summary>
/// Add inventory item request validator
/// </summary>
public class AddInventoryItemRequestValidator : AbstractValidator<AddInventoryItemRequest>
{
    public AddInventoryItemRequestValidator()
    {
        RuleFor(x => x.ItemType)
            .NotEmpty().WithMessage("Item type is required")
            .MaximumLength(50).WithMessage("Item type must not exceed 50 characters");

        RuleFor(x => x.ItemId)
            .NotEmpty().WithMessage("Item ID is required")
            .MaximumLength(100).WithMessage("Item ID must not exceed 100 characters");

        RuleFor(x => x.ItemName)
            .NotEmpty().WithMessage("Item name is required")
            .MaximumLength(100).WithMessage("Item name must not exceed 100 characters");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0")
            .LessThanOrEqualTo(9999).WithMessage("Quantity cannot exceed 9999");
    }
}
