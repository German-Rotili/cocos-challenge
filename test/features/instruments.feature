Feature: Search instruments

  Background:
    Given the market has the following instruments:
      | ticker | name                     | type     | close | previousClose |
      | ARS    | PESOS                    | MONEDA   |       |               |
      | PAMP   | Pampa Holding S.A.       | ACCIONES | 900   | 880           |
      | GGAL   | Grupo Financiero Galicia | ACCIONES | 1500  | 1450          |
      | SUPV   | Grupo Supervielle        | ACCIONES | 2000  | 2100          |
      | BMA    | Banco Macro              | ACCIONES | 5000  | 5000          |

  Scenario: Without filters every instrument is listed by ticker
    When someone searches instruments without filters
    Then the search returns:
      | ticker |
      | ARS    |
      | BMA    |
      | GGAL   |
      | PAMP   |
      | SUPV   |

  Scenario: Results come one page at a time
    When someone searches instruments without filters with limit 2 and offset 2
    Then the search returns:
      | ticker |
      | GGAL   |
      | PAMP   |
    And the search found 5 instruments in total

  Scenario: A ticker filter matches part of the ticker, ignoring case
    When someone searches instruments by ticker "pa"
    Then the search returns:
      | ticker | name               |
      | PAMP   | Pampa Holding S.A. |

  Scenario: A name filter matches part of the name, ignoring case
    When someone searches instruments by name "grupo"
    Then the search returns:
      | ticker | name                     |
      | GGAL   | Grupo Financiero Galicia |
      | SUPV   | Grupo Supervielle        |

  Scenario: A ticker filter does not look at names
    When someone searches instruments by ticker "grupo"
    Then the search returns no instruments

  Scenario: A name filter does not look at tickers
    When someone searches instruments by name "GGAL"
    Then the search returns no instruments

  Scenario: Both filters must match
    When someone searches instruments by ticker "G" and name "grupo"
    Then the search returns:
      | ticker |
      | GGAL   |

  Scenario: Both filters matching different instruments find nothing
    When someone searches instruments by ticker "SUPV" and name "Galicia"
    Then the search returns no instruments

  Scenario: A blank filter is ignored
    When someone searches instruments by ticker "   " and name "grupo"
    Then the search returns:
      | ticker |
      | GGAL   |
      | SUPV   |

  Scenario: Wildcard characters are matched literally
    When someone searches instruments by name "%"
    Then the search returns no instruments

  Scenario: Results show the last close and the daily return
    When someone searches instruments by name "a"
    Then the search returns:
      | ticker | close | previousClose | dailyReturn |
      | BMA    | 5000  | 5000          | 0           |
      | GGAL   | 1500  | 1450          | 3.45        |
      | PAMP   | 900   | 880           | 2.27        |

  Scenario: An instrument without market data has no price
    When someone searches instruments by ticker "ARS"
    Then the search returns:
      | ticker | close | previousClose | dailyReturn |
      | ARS    |       |               |             |
