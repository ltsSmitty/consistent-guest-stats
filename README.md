# Harness the Guest Swarm

## Control all guest stats at once.

![See the mind control in action](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGk1anptZTFpd2RvMXNzNjdzbnZpcmcwdmY4c2kzZTV2c3J4bGRneCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/eU3BK2Qb57ZYWB7HZO/giphy.gif)
![Image of the plugin](https://github.com/ltsSmitty/consistent-guest-stats/blob/main/images/Screenshot%202023-12-21%20at%201.49.08%E2%80%AFPM.png)

## Usage

1. Install in your plugin folder and open
2. Select which stats you'd like to start controlling, and toggle them
3. Adjust the value up or down to your preferred pain/pleasure
4. Depending on the number of guests in your park, you can increase or decrease the reset frequency. The default will reset guest stats each day, and should work for many parks. In a small park or with a more powerful computer, you can lower the interval to update every 5 game ticks, or even every single game tick! (May cause meaningful slowdown, so be aware before turning down below 5 ticks).

## FAQs

### What are the numbers?
Behind the scenes, each guest's stats can have values from 0-255, so I divided that by 16 to be more useful. That causes the range to be from 0-16.

### Why isn't anything showing up for Nausea <= 2 or TOILET >= 4?
Apparently not show all values are shown if they're enough on the extremes. Energy can actually get down to 9 before registering as missing.

### It's causing some serious lag on my big park!
I'd like to offer some help, so anything more you could share with me would be great. Find me in the OpenRCT discord @ltsSmitty
