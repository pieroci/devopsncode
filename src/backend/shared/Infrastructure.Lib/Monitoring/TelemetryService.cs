using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;

namespace GamePlatform.Infrastructure.Monitoring;

/// <summary>
/// Application Insights telemetry service
/// </summary>
public interface ITelemetryService
{
    void TrackEvent(string eventName, Dictionary<string, string>? properties = null);
    void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null);
    void TrackException(Exception exception, Dictionary<string, string>? properties = null);
    void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success);
    void TrackTrace(string message, SeverityLevel severityLevel = SeverityLevel.Information);
}

/// <summary>
/// Application Insights telemetry service implementation
/// </summary>
public class TelemetryService : ITelemetryService
{
    private readonly TelemetryClient _telemetryClient;

    public TelemetryService(TelemetryClient telemetryClient)
    {
        _telemetryClient = telemetryClient;
    }

    public void TrackEvent(string eventName, Dictionary<string, string>? properties = null)
    {
        _telemetryClient.TrackEvent(eventName, properties);
    }

    public void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null)
    {
        _telemetryClient.TrackMetric(metricName, value, properties);
    }

    public void TrackException(Exception exception, Dictionary<string, string>? properties = null)
    {
        _telemetryClient.TrackException(exception, properties);
    }

    public void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success)
    {
        _telemetryClient.TrackDependency(dependencyName, commandName, startTime, duration, success);
    }

    public void TrackTrace(string message, SeverityLevel severityLevel = SeverityLevel.Information)
    {
        _telemetryClient.TrackTrace(message, severityLevel);
    }
}

/// <summary>
/// Telemetry options
/// </summary>
public class TelemetryOptions
{
    public string InstrumentationKey { get; set; } = string.Empty;
    public string ApplicationName { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
}
