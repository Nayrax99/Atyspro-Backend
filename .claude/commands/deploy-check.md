Vérification complète avant deploy :

1. npm run build — vérifie que le TypeScript compile
2. npm run lint — vérifie les règles ESLint
3. Vérifie qu'aucun .env, clé API ou secret n'est dans le code
4. Vérifie que les fichiers sensibles sont dans .gitignore
5. git status — liste les fichiers non commités
6. Résume : ✅ prêt à deploy / ❌ problèmes à fixer
