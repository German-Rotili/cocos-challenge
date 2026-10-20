Feature: Send order

  Scenario: Market buy with exact size is filled at last close
    Given a user with 100000 ARS available
    And instrument "PAMP" with close 900
    When the user sends a MARKET BUY for 10 shares of "PAMP"
    Then the order is saved as FILLED with price 900
    And the user's available cash is 91000

  Scenario: Market buy by amount uses the max whole shares
    Given a user with 100000 ARS and "PAMP" closes at 900
    When the user sends a MARKET BUY for 10000 ARS of "PAMP"
    Then the order is FILLED with size 11
    And the user's available cash is 90100

  Scenario: Amount too small for one share is rejected
    When the user sends a MARKET BUY for 500 ARS of "PAMP"
    Then the order is saved as REJECTED

  Scenario: Buy exceeding available cash is rejected
    Given a user with 100000 ARS available
    When the user sends a MARKET BUY for 200000 ARS of "PAMP"
    Then the order is saved as REJECTED

  Scenario: Sell exceeding held shares is rejected
    Given a user with 10 shares of "PAMP"
    When the user sends a MARKET SELL for 20 shares of "PAMP"
    Then the order is saved as REJECTED

  Scenario: Limit order is saved as NEW with the given price
    Given a user with 100000 ARS available
    When the user sends a LIMIT BUY for 10 shares of "PAMP" at price 900
    Then the order is saved as NEW with price 900

  Scenario: Limit order without price is a 400 (not persisted)
    Given a user with 100000 ARS available
    When the user sends a LIMIT BUY for 10 shares of "PAMP" without a price
    Then the order is saved as a 400 error (not persisted)

  Scenario: Only NEW orders can be cancelled
    Given a user with 100000 ARS available
    And the user has a NEW order for 10 shares of "PAMP" at price 900
    When the user cancels the order
    Then the order is saved as CANCELLED