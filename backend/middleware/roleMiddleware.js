const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Accès non autorisé - Utilisateur non authentifié",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé - Rôle ${req.user.role} non autorisé`,
      });
    }

    next();
  };
};

export { authorize };
