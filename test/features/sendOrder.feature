Feature: Send order

  Background:
    Given the market has the following instruments:
      | ticker | name                     | type     | close  | previousClose |
      | ARS    | PESOS                    | MONEDA   |        |               |
      | PAMP   | Pampa Holding S.A.       | ACCIONES | 900    | 880           |
      | GGAL   | Grupo Financiero Galicia | ACCIONES | 1500   | 1450          |
      | TXAR   | Ternium Argentina S.A.   | ACCIONES | 333.33 | 330           |
      | GAMI   | Boldt Gaming S.A.        | ACCIONES | 0.07   | 0.07          |

  Scenario: Market buy with exact size is filled at last close
    Given a user with 100000 ARS available
    When the user sends a MARKET BUY for 10 shares of "PAMP"
    Then the order is saved as FILLED with price 900
    And the user's available cash is 91000

  Scenario: Market buy by amount uses the max whole shares
    Given a user with 100000 ARS available
    When the user sends a MARKET BUY for 10000 ARS of "PAMP"
    Then the order is saved as FILLED with size 11
    And the user's available cash is 90100

  Scenario: Amount too small for one share is rejected
    Given a user with 100000 ARS available
    When the user sends a MARKET BUY for 500 ARS of "PAMP"
    Then the order is saved as REJECTED
    And the user's available cash is 100000

  Scenario: Buy exceeding available cash is rejected
    Given a user with 100000 ARS available
    When the user sends a MARKET BUY for 200000 ARS of "PAMP"
    Then the order is saved as REJECTED
    And the user's available cash is 100000

  Scenario: Sell exceeding held shares is rejected
    Given a user with 10 shares of "PAMP"
    When the user sends a MARKET SELL for 20 shares of "PAMP"
    Then the order is saved as REJECTED

  Scenario: Limit order is saved as NEW with the given price
    Given a user with 100000 ARS available
    When the user sends a LIMIT BUY for 10 shares of "PAMP" at price 850
    Then the order is saved as NEW with price 850
    And the user's available cash is 91500

  Scenario: Limit order without price is a bad request
    Given a user with 100000 ARS available
    When the user sends a LIMIT BUY for 10 shares of "PAMP" without a price
    Then the request fails with status 400
    And no order is persisted

  Scenario: A NEW order can be cancelled
    Given a user with 100000 ARS available
    And the user has a NEW LIMIT BUY for 10 shares of "PAMP" at price 900
    When the user cancels the order
    Then the order is saved as CANCELLED
    And the user's available cash is 100000

  Scenario: A FILLED order cannot be cancelled
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 10 shares of "PAMP"
    When the user cancels the order
    Then the request fails with status 409
    And the order is still FILLED
    And the user's available cash is 91000

  Scenario: Sending both size and budget is a bad request
    Given a user with 100000 ARS available
    When the user sends a MARKET BUY of "PAMP" with both a size of 10 and an amount of 9000
    Then the request fails with status 400
    And no order is persisted
    
  Scenario: A cash deposit sent as a budget is a bad request
    Given a user with 100000 ARS available
    When the user deposits 5000 ARS sent as a budget
    Then the request fails with status 400
    And the user's available cash is 100000

  Scenario: Decimal prices leave exact cash
    Given a user with 1000 ARS available
    When the user sends a MARKET BUY for 3 shares of "TXAR"
    Then the order is saved as FILLED with price 333.33
    And the user's available cash is 0.01

  Scenario: The last cent of the balance can be spent
    Given a user with 1000 ARS available
    And the user has a FILLED MARKET BUY for 3 shares of "TXAR"
    When the user sends a LIMIT BUY for 1 shares of "TXAR" at price 0.01
    Then the order is saved as NEW
    And the user's available cash is 0

  Scenario: A budget that exactly covers whole shares buys all of them
    Given a user with 100 ARS available
    When the user sends a MARKET BUY for 0.21 ARS of "GAMI"
    Then the order is saved as FILLED with size 3
    And the user's available cash is 99.79

  Scenario: A limit price with more than 2 decimals is a bad request
    Given a user with 100000 ARS available
    When the user sends a LIMIT BUY for 10 shares of "PAMP" at price 850.555
    Then the request fails with status 400
    And no order is persisted
