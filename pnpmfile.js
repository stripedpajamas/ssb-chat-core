module.exports = {
  hooks: {
    readPackage: (pkg, context) => {
      if (pkg.name === 'ssb-validate') {
        const ssbKeysVersion = pkg.devDependencies['ssb-keys']
        pkg.dependencies = {
          ...pkg.dependencies,
          'ssb-keys': ssbKeysVersion
        }
        delete pkg.devDependencies['ssb-keys']
        context.log(`Added ssb-keys@${ssbKeysVersion} to ssb-validate dependencies`)
      }
      return pkg
    }
  }
}