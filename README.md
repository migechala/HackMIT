# HackMIT Project

## The Problem

Dead urban areas (ie. empty malls, empty office spaces, vacant lots, etc) are a growing occurance in major US cities. It's important that we find a way to find a use for these spaces for urban developers, city ordinance planners, and environmental developers. 


Our HackMIT project will revolve around creating a scalable service that will allow for users to discover potential reusable spaces and if time permits, include a feature to create an offer for them as well. We want to specifically target the ASUS HackMIT track, Volterage HackMIT track, the SpaceX track, the Cognition track, and the Arduino track.


## Our Plan:
 - from the frontend, the user will select an area (10m^2 or so) in a city as well as their needs.
 - The request will be sent to a backend server which will use an Arduino UNO Q 4GB as a load balancer.
 - Once it's time, the request will be sent to our ASUS Ascent GX10 AI Supercomputer that will poll information from api's about the land and space and a model will determine potential locations that fit the users needs.
 - The information will be sent back to the frontend and the user will see a map with populated marks on each point our model finds along with info about that land as well.

## Data Required for Model
 - Sunlight
 - Soil Quality
 - When it was last used
 - How much it's worth
 - Current state of the land
 - What type of land is it
 - Location
 - Weather
 - Damage
 - Foot traffic
 - Visibility
 - Cost to repair

