param([String]$AccessToken = "AccessToken")

try{
    $requiredModules = 'Az.Accounts', 'SqlServer'
    foreach ($module in $requiredModules) {
        if (-not (Get-Module -ListAvailable -Name $module)) {
            Write-Output "Installing module $module ..." 
            Install-Module -Name $module -Force -AllowClobber
            Write-Output "Module $module installed correctly..."
        }
        else 
        {
            Write-Output "Module $module already installed..." 
        }
        Import-Module $module

        $modulePath = (Get-Module -Name $module).ModuleBase

        $env:PSModulePath = $env:PSModulePath + ":$modulePath"
    }

    $serverName = '${serverName}'
    $databaseName = '${databaseName}'
    $query = '${query}'

    Write-Host "${serverName} - ${databaseName}: Executing '${query}'"
    Invoke-Sqlcmd -ServerInstance "${serverName}.database.windows.net" -Database $databaseName -AccessToken $Access_token -Query $query -IncludeSqlUserErrors
    
    exit 0
}
catch {
    Write-Error $_
    exit 1
}