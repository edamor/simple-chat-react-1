#!/bin/bash


gh_deploy () {
echo " > > > Enter commit message:"
read commit
git add .
git commit -m "$commit"
echo "Pushing to repo... > > > "
git push origin master
echo "Deploying to gh pages... > > > "
npm run deploy
echo "<- <- <- Success -> -> ->"
}

gh_deploy
