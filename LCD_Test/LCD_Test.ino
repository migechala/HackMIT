/*
  Basic 16x2 LCD test for Arduino Uno using a parallel HD44780-compatible LCD.

  Wiring (common Arduino example wiring):
    LCD VSS -> GND
    LCD VDD -> 5V
    LCD VO  -> middle pin of 10k potentiometer (pot ends to 5V and GND)
    LCD RS  -> Arduino pin 12
    LCD RW  -> GND
    LCD E   -> Arduino pin 11
    LCD D4  -> Arduino pin 5
    LCD D5  -> Arduino pin 4
    LCD D6  -> Arduino pin 3
    LCD D7  -> Arduino pin 2
    LCD A/LED+ -> 5V through 220 ohm resistor (or to 5V if your module has resistor)
    LCD K/LED- -> GND

  If your wires use different Arduino pins, change the LiquidCrystal lcd(...) line below.
*/

#include <LiquidCrystal.h>

//                RS  E   D4 D5 D6 D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  Serial.begin(9600);
  Serial.println("LCD test starting...");

  // Change to lcd.begin(20, 4) if you have a 20x4 display.
  lcd.begin(16, 2);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD works!");
  lcd.setCursor(0, 1);
  lcd.print("HackMIT test");
  delay(2000);
}

void loop() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Seconds on:");
  lcd.setCursor(0, 1);
  lcd.print(millis() / 1000);
  delay(1000);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Cursor test --->");
  for (int col = 0; col < 16; col++) {
    lcd.setCursor(col, 1);
    lcd.print("*");
    delay(100);
  }
  delay(500);
}
