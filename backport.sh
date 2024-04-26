git reset HEAD~1
rm ./backport.sh
git cherry-pick a73a0a7400ff565fe257daf9334ac621e71f1967
echo 'Resolve conflicts and force push this branch'
