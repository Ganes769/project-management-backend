def slugify(text: str, sep="`*"):
    clean = text.strip().lower()
    return clean.replace("-", sep)


print(slugify("payment-api", sep="8"))


# using * in the func arg
def archive_project(name: str, *, notify=False, force=True):
    if force:
        print(f"Force archive {name}")
    if notify:
        print(f"Notify archive {name}")


print(archive_project("nasa", notify=True, force=False))


def build_project(name, **kwargs):
    # With kwargs we can give multiple argument for function signature
    project = {"name": name, "slug": slugify(name)}
    project.update(kwargs)
    return project


print(build_project("Nasa", description="description"))
