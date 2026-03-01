using FluentAssertions;
using FluentAssertions.Execution;

namespace GamePlatform.Tests.Shared;

/// <summary>
/// Extension methods for enhanced test assertions
/// </summary>
public static class AssertionExtensions
{
    /// <summary>
    /// Assert that API response is successful
    /// </summary>
    public static void ShouldBeSuccessfulResponse<T>(this T response, string because = "")
        where T : class
    {
        using (new AssertionScope())
        {
            response.Should().NotBeNull(because);
            
            var successProperty = response.GetType().GetProperty("Success");
            successProperty.Should().NotBeNull();
            successProperty!.GetValue(response).Should().Be(true, because);
        }
    }

    /// <summary>
    /// Assert that API response has data
    /// </summary>
    public static TData ShouldHaveData<T, TData>(this T response, string because = "")
        where T : class
    {
        using (new AssertionScope())
        {
            response.ShouldBeSuccessfulResponse(because);
            
            var dataProperty = response.GetType().GetProperty("Data");
            dataProperty.Should().NotBeNull();
            
            var data = dataProperty!.GetValue(response);
            data.Should().NotBeNull(because);
            
            return (TData)data!;
        }
    }

    /// <summary>
    /// Assert that API response is an error
    /// </summary>
    public static void ShouldBeErrorResponse<T>(this T response, string because = "")
        where T : class
    {
        using (new AssertionScope())
        {
            response.Should().NotBeNull(because);
            
            var successProperty = response.GetType().GetProperty("Success");
            successProperty.Should().NotBeNull();
            successProperty!.GetValue(response).Should().Be(false, because);
        }
    }

    /// <summary>
    /// Assert that API response has error message
    /// </summary>
    public static void ShouldHaveErrorMessage<T>(this T response, string expectedMessage, string because = "")
        where T : class
    {
        using (new AssertionScope())
        {
            response.ShouldBeErrorResponse(because);
            
            var messageProperty = response.GetType().GetProperty("Message");
            messageProperty.Should().NotBeNull();
            
            var message = messageProperty!.GetValue(response) as string;
            message.Should().Contain(expectedMessage, because);
        }
    }

    /// <summary>
    /// Assert that collection is not null or empty
    /// </summary>
    public static void ShouldNotBeNullOrEmpty<T>(this IEnumerable<T>? collection, string because = "")
    {
        using (new AssertionScope())
        {
            collection.Should().NotBeNull(because);
            collection.Should().NotBeEmpty(because);
        }
    }

    /// <summary>
    /// Assert that value is within range
    /// </summary>
    public static void ShouldBeInRange<T>(this T value, T min, T max, string because = "")
        where T : IComparable<T>
    {
        using (new AssertionScope())
        {
            value.Should().BeGreaterOrEqualTo(min, because);
            value.Should().BeLessOrEqualTo(max, because);
        }
    }

    /// <summary>
    /// Assert that DateTime is recent (within last minute)
    /// </summary>
    public static void ShouldBeRecent(this DateTime dateTime, string because = "")
    {
        dateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1), because);
    }

    /// <summary>
    /// Assert that task completes within timeout
    /// </summary>
    public static async Task ShouldCompleteWithin(this Task task, TimeSpan timeout, string because = "")
    {
        var completedTask = await Task.WhenAny(task, Task.Delay(timeout));
        completedTask.Should().Be(task, because);
        await task; // Propagate any exceptions
    }
}
