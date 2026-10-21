Feature: Portfolio

  Background:
    Given the market has the following instruments:
      | ticker | name                     | type     | close  | previousClose |
      | ARS    | PESOS                    | MONEDA   |        |               |
      | PAMP   | Pampa Holding S.A.       | ACCIONES | 900    | 880           |
      | GGAL   | Grupo Financiero Galicia | ACCIONES | 1500   | 1450          |
      | TXAR   | Ternium Argentina S.A.   | ACCIONES | 333.33 | 330           |

  Scenario: An account with only cash has no positions
    Given a user with 100000 ARS available
    When the user checks their portfolio
    Then the user's available cash is 100000
    And the account's total value is 100000
    And the portfolio has no positions

  Scenario: A filled buy becomes a position valued at the last close
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    When the user checks their portfolio
    Then the user's available cash is 91000
    And the account's total value is 100000
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | PAMP   | 10       | 9000        | 0           |

  Scenario: A position's value and return follow the market price
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 990
    When the user checks their portfolio
    Then the account's total value is 100900
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | PAMP   | 10       | 9900        | 10          |

  Scenario: Several buys are averaged by cost
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 1200
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 1260
    When the user checks their portfolio
    Then the user's available cash is 79000
    And the account's total value is 104200
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | PAMP   | 20       | 25200       | 20          |

  Scenario: Selling part of a position keeps its average cost
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 1080
    And the user has a FILLED MARKET SELL for 4 shares of "PAMP"
    When the user checks their portfolio
    Then the user's available cash is 95320
    And the account's total value is 101800
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | PAMP   | 6        | 6480        | 20          |

  Scenario: Selling a whole position removes it
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the user has a FILLED MARKET SELL for 10 shares of "PAMP"
    When the user checks their portfolio
    Then the user's available cash is 100000
    And the portfolio has no positions

  Scenario: Buying again after selling everything starts a new average cost
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 1000
    And the user has a FILLED MARKET SELL for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 1200
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the last close of "PAMP" moves to 1260
    When the user checks their portfolio
    Then the account's total value is 101600
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | PAMP   | 10       | 12600       | 5           |

  Scenario: A pending limit buy reserves cash but keeps the account's value
    Given a user with 100000 ARS available
    And the user has a NEW LIMIT BUY for 10 shares of "PAMP" at price 850
    When the user checks their portfolio
    Then the user's available cash is 91500
    And the account's total value is 100000
    And the portfolio has no positions

  Scenario: Shares offered in a pending limit sell are still held
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the user has a NEW LIMIT SELL for 10 shares of "PAMP" at price 1000
    When the user checks their portfolio
    Then the account's total value is 100000
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | PAMP   | 10       | 9000        | 0           |

  Scenario: Positions in several instruments are listed separately
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    And the user has a FILLED MARKET BUY for 5 shares of "GGAL"
    When the user checks their portfolio
    Then the user's available cash is 83500
    And the account's total value is 100000
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | GGAL   | 5        | 7500        | 0           |
      | PAMP   | 10       | 9000        | 0           |

  Scenario: A position shows its daily return from the last two closes
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    When the user checks their portfolio
    Then the "PAMP" position's daily return is 2.27

  Scenario: The portfolio of an unknown user is not found
    When someone checks the portfolio of a user that doesn't exist
    Then the request fails with status 404

  Scenario: Decimal prices keep cash and value exact
    Given a user with 1000 ARS available
    And the user has a FILLED MARKET BUY for 3 shares of "TXAR"
    When the user checks their portfolio
    Then the user's available cash is 0.01
    And the account's total value is 1000
    And the portfolio has the following positions:
      | ticker | quantity | marketValue | totalReturn |
      | TXAR   | 3        | 999.99      | 0           |
