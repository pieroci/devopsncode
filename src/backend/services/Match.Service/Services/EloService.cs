using GamePlatform.Match.Service.Models;

namespace GamePlatform.Match.Service.Services;

/// <summary>
/// Interface for ELO rating calculations and management
/// </summary>
public interface IEloService
{
    /// <summary>
    /// Calculate ELO change for a player after a match
    /// </summary>
    int CalculateEloChange(int playerElo, int opponentElo, double actualScore, int gamesPlayed);

    /// <summary>
    /// Calculate expected score based on ELO difference
    /// </summary>
    double CalculateExpectedScore(int playerElo, int opponentElo);

    /// <summary>
    /// Get K-factor based on games played
    /// </summary>
    int GetKFactor(int gamesPlayed);

    /// <summary>
    /// Get rank from ELO rating
    /// </summary>
    string GetRankFromElo(int elo);

    /// <summary>
    /// Get ELO range for rank
    /// </summary>
    (int min, int max) GetEloRangeForRank(string rank);
}

/// <summary>
/// Service for ELO rating calculations
/// </summary>
public class EloService : IEloService
{
    private readonly ILogger<EloService> _logger;

    public EloService(ILogger<EloService> logger)
    {
        _logger = logger;
    }

    public int CalculateEloChange(int playerElo, int opponentElo, double actualScore, int gamesPlayed)
    {
        var expectedScore = CalculateExpectedScore(playerElo, opponentElo);
        var kFactor = GetKFactor(gamesPlayed);
        
        var eloChange = (int)Math.Round(kFactor * (actualScore - expectedScore));
        
        _logger.LogDebug("ELO Change: PlayerELO={PlayerElo}, OpponentELO={OpponentElo}, " +
                        "ActualScore={ActualScore}, Expected={Expected}, K={K}, Change={Change}",
                        playerElo, opponentElo, actualScore, expectedScore, kFactor, eloChange);
        
        return eloChange;
    }

    public double CalculateExpectedScore(int playerElo, int opponentElo)
    {
        // ELO formula: E = 1 / (1 + 10^((OpponentELO - PlayerELO) / 400))
        return 1.0 / (1.0 + Math.Pow(10, (opponentElo - playerElo) / 400.0));
    }

    public int GetKFactor(int gamesPlayed)
    {
        // K-factor decreases as player gains experience
        if (gamesPlayed < 30) return 32;    // New players - faster ELO changes
        if (gamesPlayed < 100) return 24;   // Intermediate players
        return 16;                          // Veteran players - slower changes
    }

    public string GetRankFromElo(int elo)
    {
        return elo switch
        {
            >= 1800 => "Master",
            >= 1600 => "Diamond",
            >= 1400 => "Platinum",
            >= 1200 => "Gold",
            >= 1000 => "Silver",
            _ => "Bronze"
        };
    }

    public (int min, int max) GetEloRangeForRank(string rank)
    {
        return rank.ToLower() switch
        {
            "master" => (1800, int.MaxValue),
            "diamond" => (1600, 1799),
            "platinum" => (1400, 1599),
            "gold" => (1200, 1399),
            "silver" => (1000, 1199),
            "bronze" => (0, 999),
            _ => (0, int.MaxValue)
        };
    }
}
